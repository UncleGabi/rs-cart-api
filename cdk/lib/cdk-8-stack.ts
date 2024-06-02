import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";

import * as rds from "aws-cdk-lib/aws-rds";
import * as apigw from "aws-cdk-lib/aws-apigateway";

import { ParameterGroup, DatabaseInstanceEngine } from "aws-cdk-lib/aws-rds";
import { PostgresEngineVersion } from "aws-cdk-lib/aws-rds";
import path = require("path");
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

export class Cdk8Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "MyVPC", { maxAzs: 2 });

    vpc.addInterfaceEndpoint("SecretsManagerEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    const engine = DatabaseInstanceEngine.postgres({
      version: PostgresEngineVersion.VER_16_2,
    });

    const parameterGroup = new ParameterGroup(this, "parameter-group", {
      engine,
      parameters: {
        "rds.force_ssl": "0",
      },
    });
    const dbSecretName = "rds_credentials_secret"
    const dbCredentialsSecret = rds.Credentials.fromGeneratedSecret("postgres", { secretName: dbSecretName });
    const dbName = "rabo_db"

    const dbInstance = new rds.DatabaseInstance(this, "DBInstance", {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      engine,
      parameterGroup,
      allocatedStorage: 20,
      backupRetention: cdk.Duration.days(0),
      deletionProtection: false,
      maxAllocatedStorage: 100,
      multiAz: false,
      publiclyAccessible: true, // Make it publicly accessible for simplicity
      storageType: rds.StorageType.GP2,
      databaseName: dbName,
      credentials: dbCredentialsSecret,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
    });

    dbInstance.connections.allowFromAnyIpv4(ec2.Port.tcp(5432));

    const appSecret = Secret.fromSecretNameV2(this,'app-secret-id',dbSecretName);
    const dbUserPassword = appSecret.secretValueFromJson('password').unsafeUnwrap();

    const nestJsFunction = new lambda.Function(this, "NestJsFunction", {
      vpc,
      environment: {
        DB_USER_NAME: dbCredentialsSecret.username,
        DB_USER_PASSWORD: dbUserPassword,
        DB_PORT: dbInstance.instanceEndpoint.port.toString(),
        DB_HOST: dbInstance.instanceEndpoint.hostname,
        DB_NAME: dbName
      },
      code: lambda.Code.fromAsset(
        path.resolve(__dirname, "../../build/rs-cart-api.zip")
      ),
      handler: "lambda.handler", // The exported handler in your entry point file
      runtime: lambda.Runtime.NODEJS_20_X,
      logRetention: cdk.aws_logs.RetentionDays.ONE_DAY,
      memorySize: 1256,
      timeout: cdk.Duration.seconds(5),
    });
    dbInstance.secret?.grantRead(nestJsFunction);

    new apigw.LambdaRestApi(this, "rest-api-gateway", {
      handler: nestJsFunction,
      restApiName: "NestJsApiGateway",
      proxy: true,
      deploy: true,
    });
  }
}
