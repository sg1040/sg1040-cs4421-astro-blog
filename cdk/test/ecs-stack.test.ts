import { expect, test } from '@jest/globals';
import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { EcrStack, EcsStack } from '../lib/ecs-stack';

function synthesize(certificateArn?: string) {
  const app = new cdk.App();
  const ecrStack = new EcrStack(app, 'TestEcrStack');
  return Template.fromStack(new EcsStack(app, 'TestEcsStack', {
    repository: ecrStack.repository,
    certificateArn,
  }));
}

test('uses the exported ECR repository and an image tag parameter defaulting to latest', () => {
  const template = synthesize();

  template.hasParameter('ImageTag', {
    Type: 'String',
    Default: 'latest',
    MinLength: 1,
  });
  template.hasResourceProperties('AWS::ECS::TaskDefinition', {
    ContainerDefinitions: Match.arrayWith([Match.objectLike({
      Image: {
        'Fn::Join': ['', Match.arrayWith([
          { 'Fn::ImportValue': Match.anyValue() },
          ':',
          { Ref: 'ImageTag' },
        ])],
      },
    })]),
  });
  template.hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Effect: 'Allow',
          Action: Match.arrayWith([
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
          ]),
          Resource: { 'Fn::ImportValue': Match.anyValue() },
        }),
        Match.objectLike({
          Effect: 'Allow',
          Action: 'ecr:GetAuthorizationToken',
          Resource: '*',
        }),
      ]),
    },
  });
});

test('uses small Linux x86-64 task defaults without NAT gateways', () => {
  const template = synthesize();

  template.resourceCountIs('AWS::EC2::NatGateway', 0);
  template.resourceCountIs('AWS::EC2::Subnet', 2);
  template.hasResourceProperties('AWS::ECS::Service', {
    DesiredCount: Match.absent(),
    LaunchType: 'FARGATE',
    NetworkConfiguration: {
      AwsvpcConfiguration: { AssignPublicIp: 'ENABLED' },
    },
    DeploymentConfiguration: {
      MinimumHealthyPercent: 100,
      MaximumPercent: 200,
      DeploymentCircuitBreaker: { Enable: true, Rollback: true },
    },
    HealthCheckGracePeriodSeconds: 60,
  });
  template.hasResourceProperties('AWS::ECS::TaskDefinition', {
    Cpu: '256',
    Memory: '512',
    RuntimePlatform: Match.absent(),
    ContainerDefinitions: Match.arrayWith([Match.objectLike({
      PortMappings: [{ ContainerPort: 4321, Protocol: 'tcp' }],
      HealthCheck: Match.objectLike({
        Command: ['CMD-SHELL', 'wget --no-verbose --tries=1 --spider http://localhost:4321/api/health/live || exit 1'],
      }),
    })]),
  });
  template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
    HealthCheckPath: '/api/health/ready',
    Matcher: Match.absent(),
    TargetType: 'ip',
  });
  template.hasResourceProperties('AWS::Logs::LogGroup', { RetentionInDays: 7 });
});

test('only permits application ingress from the load balancer security group', () => {
  const template = synthesize();
  const ingressRules = Object.values(template.findResources('AWS::EC2::SecurityGroupIngress'));
  const applicationRules = ingressRules.filter(rule => rule.Properties.FromPort === 4321);

  expect(applicationRules).toHaveLength(1);
  expect(applicationRules[0].Properties.SourceSecurityGroupId).toBeDefined();
  expect(applicationRules[0].Properties.CidrIp).toBeUndefined();
  template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 80,
    Protocol: 'HTTP',
    DefaultActions: Match.arrayWith([Match.objectLike({ Type: 'forward' })]),
  });
});

test('enables HTTPS and redirects HTTP when a certificate is supplied', () => {
  const certificateArn = 'arn:aws:acm:us-east-1:123456789012:certificate/11111111-1111-1111-1111-111111111111';
  const template = synthesize(certificateArn);

  template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 443,
    Protocol: 'HTTPS',
    Certificates: [{ CertificateArn: certificateArn }],
  });
  template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 80,
    DefaultActions: Match.arrayWith([Match.objectLike({
      Type: 'redirect',
      RedirectConfig: Match.objectLike({ Protocol: 'HTTPS', Port: '443' }),
    })]),
  });
});