# CDK Infrastructure

The app defines the existing `StaticSiteStack`, `EcrStack`, and the container
runtime in `EcsStack`. `EcrStack` exposes its repository to `EcsStack` through a
CDK cross-stack reference. Target `EcsStack` explicitly to leave the static site
unchanged; CDK also deploys its dependency, `EcrStack`, when needed.

## ECS Architecture

- CDK defaults: on-demand Linux x86-64 Fargate, 0.25 vCPU and 512 MiB memory.
	New services start with one task; updates preserve the existing desired count.
- Public subnets across two availability zones, public task IPs, no NAT gateways.
- Internet-facing Application Load Balancer; task port 4321 accepts traffic only
	from the load balancer security group.
- ALB readiness checks at `/api/health/ready`, container liveness checks at
	`/api/health/live`, and automatic rollback of failed deployments.
- CloudWatch application logs retained for seven days and deleted with the stack.
- Application image pulled from `EcrStack.repository`. CDK grants the task
	execution role pull access to that repository automatically.
- CloudFormation parameter `ImageTag` selects the image tag and defaults to
	`latest` on initial deployment. Build and push a `linux/amd64` image before
	deploying the ECS service. CDK no longer builds or publishes the image.

One task is suitable for coursework, not high availability. For production,
set `desiredCount: 2` and measure whether the task size is sufficient.
Rolling deployments can temporarily run two tasks.

## Validate and Deploy

Run these commands from the `cdk` directory. Image publishing requires Docker
with Buildx, plus the AWS CLI. The standard x86-64 `ubuntu-latest` GitHub runner
can build this image natively. Configure AWS credentials
for the target account; synthesis itself does not require Docker.
The current stack entry point targets account `182313261325` in `us-east-1`.

```sh
npm install
npx tsc --noEmit
npm test -- --runInBand test/ecs-stack.test.ts
npx cdk synth EcsStack
npx cdk diff EcsStack
```

Synthesis may look up availability zones using AWS credentials, but does not
build the Docker image or deploy resources. To deploy, bootstrap the environment
once if it is not already bootstrapped, then deploy the repository:

```sh
npx cdk bootstrap aws://182313261325/us-east-1
npx cdk deploy EcrStack
```

Read the repository URI from the stack output, authenticate Docker and publish
an image. These commands still run from the `cdk` directory:

```sh
REPOSITORY_URI=$(aws cloudformation describe-stacks --stack-name EcrStack --region us-east-1 --query 'Stacks[0].Outputs[?OutputKey==`RepositoryUri`].OutputValue' --output text)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin "${REPOSITORY_URI%%/*}"
docker buildx build --platform linux/amd64 -t "$REPOSITORY_URI:latest" --push ..
npx cdk deploy EcsStack --parameters EcsStack:ImageTag=latest
```

To deploy a specific version, push it under a unique tag, then use:

```sh
npx cdk deploy EcsStack --parameters EcsStack:ImageTag=release-001
```

Omitting `ImageTag` uses `latest` on initial deployment. CDK normally preserves
the previous parameter value on updates. Changing the tag creates a task
definition revision and rolls out new tasks. Re-pushing the same tag, including
`latest`, does not by itself trigger a deployment; use unique release tags or
force a new ECS service deployment after pushing.

By default the ALB serves HTTP on port 80 for initial lab testing. Use the
`LoadBalancerDnsName` stack output to visit the site.

## HTTPS

For a public site, supply an existing ACM certificate ARN in the same region:

```sh
npx cdk deploy EcsStack -c certificateArn=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERTIFICATE_ID
```

This enables HTTPS on port 443 and redirects HTTP to HTTPS. Create a DNS record
for a domain covered by that certificate pointing to the ALB; the AWS-generated
ALB hostname is not covered by your domain certificate. Pass the same context
on subsequent synth, diff and deploy commands to retain HTTPS.

## Cost and Cleanup

Allow roughly $36.50/month for the one-task compute, ALB and public IPv4 baseline
in `us-east-1`, before variable usage, storage, logs, DNS, taxes or credits.
There are no NAT gateway charges. Scaling the service to zero stops task
compute charges but does not stop ALB charges.

```sh
npx cdk destroy EcsStack
```

Destroying this stack removes the service, ALB, networking and application logs.
It does not remove the repository or static site stack. Destroy `EcsStack`
before `EcrStack` because the service imports the repository's attributes.
The repository has a destroy removal policy, but ECR blocks deletion while
images remain; remove images deliberately before destroying the repository.
