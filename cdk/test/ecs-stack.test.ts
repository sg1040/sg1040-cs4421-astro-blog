import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { CdkStack } from "../lib/cdk-stack";

test("Creates a CloudFormation template", () => {
  const app = new cdk.App();

  const stack = new CdkStack(app, "TestStack");

  const template = Template.fromStack(stack);

  template.resourceCountIs("AWS::ECS::Service", 1);
});