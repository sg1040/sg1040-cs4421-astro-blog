import * as cdk from 'aws-cdk-lib';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface AstroServiceStackProps extends cdk.StackProps {
  repository: ecr.IRepository;
  imageTag: string;
}

export class AstroServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AstroServiceStackProps) {
    super(scope, id, props);

    const accessRole = new iam.Role(this, 'AppRunnerEcrAccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      description: 'Allows App Runner to pull the Astro image from ECR.',
    });

    const ecrAccessPolicy = new iam.Policy(this, 'AppRunnerEcrAccessPolicy', {
      statements: [
        new iam.PolicyStatement({
          actions: ['ecr:GetAuthorizationToken'],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          actions: [
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
          ],
          resources: [props.repository.repositoryArn],
        }),
      ],
    });
    ecrAccessPolicy.attachToRole(accessRole);

    const service = new apprunner.CfnService(this, 'AstroAppRunnerService', {
      serviceName: 'astro-blog',
      sourceConfiguration: {
        autoDeploymentsEnabled: false,
        authenticationConfiguration: {
          accessRoleArn: accessRole.roleArn,
        },
        imageRepository: {
          imageIdentifier: props.repository.repositoryUriForTag(props.imageTag),
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '4321',
            runtimeEnvironmentVariables: [
              { name: 'HOST', value: '0.0.0.0' },
              { name: 'PORT', value: '4321' },
            ],
          },
        },
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/api/health',
        interval: 10,
        timeout: 5,
        healthyThreshold: 1,
        unhealthyThreshold: 3,
      },
    });
    service.node.addDependency(ecrAccessPolicy);

    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://${service.attrServiceUrl}`,
    });
  }
}
