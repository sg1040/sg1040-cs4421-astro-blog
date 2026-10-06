#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { AstroImageStack } from '../lib/cdk-stack';
import { AstroServiceStack } from '../lib/apprunner-stack';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};
const imageStack = new AstroImageStack(app, 'AstroImageStack', { env });
new AstroServiceStack(app, 'AstroServiceStack', {
  env,
  repository: imageStack.repository,
  imageTag: process.env.IMAGE_TAG ?? 'latest',
});
