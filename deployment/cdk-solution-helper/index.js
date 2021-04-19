/**
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

// Imports
const fs = require('fs');
const proc = require("process");

// Paths
const global_s3_assets = proc.argv[2];

// For each template in global_s3_assets ...
fs.readdirSync(global_s3_assets).forEach(file => {

    // Import and parse template file
    const raw_template = fs.readFileSync(`${global_s3_assets}/${file}`);
    let template = JSON.parse(raw_template);

    // Clean-up Lambda function code dependencies
    const resources = (template.Resources) ? template.Resources : {};
    const lambdaFunctions = Object.keys(resources).filter(function(key) {
      return resources[key].Type === "AWS::Lambda::Function";
    });
    lambdaFunctions.forEach(function(f) {
        const fn = template.Resources[f];
        if (fn.Properties.Code.hasOwnProperty('S3Bucket')) {
          // Set the S3 key reference
          let artifactHash = Object.assign(fn.Properties.Code.S3Bucket.Ref);
            artifactHash = artifactHash.replace('AssetParameters', '');
            artifactHash = artifactHash.substring(0, artifactHash.indexOf('S3Bucket'));
          const assetPath = `asset.${artifactHash}`;
          fn.Properties.Code.S3Key = `%%SOLUTION_NAME%%/%%VERSION%%/${assetPath}.zip`;
          // Set the S3 bucket reference
          fn.Properties.Code.S3Bucket = {
            'Fn::Sub': '%%BUCKET_NAME%%-${AWS::Region}'
          };
          // Set the handler
          // const handler = fn.Properties.Handler;
          // fn.Properties.Handler = `${assetPath}/${handler}`;
        }
    });

    // Clean-up Lambda layer code dependencies
    const lambdaLayers = Object.keys(resources).filter(function(key) {
      return resources[key].Type === "AWS::Lambda::LayerVersion";
    });
    lambdaLayers.forEach(function(f) {
        const fn = template.Resources[f];
        if (fn.Properties.Content.hasOwnProperty('S3Bucket')) {
          // Set the S3 key reference
          let artifactHash = Object.assign(fn.Properties.Content.S3Bucket.Ref);
            artifactHash = artifactHash.replace('AssetParameters', '');
            artifactHash = artifactHash.substring(0, artifactHash.indexOf('S3Bucket'));
          const assetPath = `asset.${artifactHash}`;
          fn.Properties.Content.S3Key = `%%SOLUTION_NAME%%/%%VERSION%%/${assetPath}.zip`;
          // Set the S3 bucket reference
          fn.Properties.Content.S3Bucket = {
            'Fn::Sub': '%%BUCKET_NAME%%-${AWS::Region}'
          };
          // Set the handler
          // const handler = fn.Properties.Handler;
          // fn.Properties.Handler = `${assetPath}/${handler}`;
        }
    });

    // Clean-up CDK BucketDeployment policy code dependencies
    const cdkBucketDeploymentPolicy = Object.keys(resources).filter(function(key) {
      return (resources[key].Type === "AWS::IAM::Policy" && resources[key].Properties.PolicyName.includes("CustomCDKBucketDeployment"));
    });
    cdkBucketDeploymentPolicy.forEach(function(f) {
      const fn = template.Resources[f];
      fn.Properties.PolicyDocument.Statement[0].Resource[0]['Fn::Join'][1][3] = {
        'Fn::Sub': '%%BUCKET_NAME%%-${AWS::Region}'
      };
      fn.Properties.PolicyDocument.Statement[0].Resource[1]['Fn::Join'][1][3] = {
        'Fn::Sub': '%%BUCKET_NAME%%-${AWS::Region}'
      };
    });
    
    // Clean-up CDK BucketDeployment code dependencies
    const cdkBucketDeployment = Object.keys(resources).filter(function(key) {
      return resources[key].Type === "Custom::CDKBucketDeployment";
    });
    cdkBucketDeployment.forEach(function(f) {
      const fn = template.Resources[f];
      if (fn.Properties.hasOwnProperty('SourceBucketNames')) {
        // Set the S3 key reference
        let artifactHash = Object.assign(fn.Properties.SourceBucketNames[0].Ref);
          artifactHash = artifactHash.replace('AssetParameters', '');
          artifactHash = artifactHash.substring(0, artifactHash.indexOf('S3Bucket'));
        const assetPath = `asset.${artifactHash}`;
        fn.Properties.SourceObjectKeys = [`%%SOLUTION_NAME%%/%%VERSION%%/${assetPath}.zip`];
        // Set the S3 bucket reference
        fn.Properties.SourceBucketNames = [{
          'Fn::Sub': '%%BUCKET_NAME%%-${AWS::Region}'
        }];
      }
    });

    // Clean-up parameters section
    const parameters = (template.Parameters) ? template.Parameters : {};
    const assetParameters = Object.keys(parameters).filter(function(key) {
      return key.includes('AssetParameters');
    });
    assetParameters.forEach(function(a) {
        template.Parameters[a] = undefined;
    });

    // Output modified template file
    const output_template = JSON.stringify(template, null, 2);
    fs.writeFileSync(`${global_s3_assets}/${file}`, output_template);
});