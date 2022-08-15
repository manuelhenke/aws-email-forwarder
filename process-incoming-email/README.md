# process-incoming-email-handler

This package is used to be bundled as a lambda function. Although the dependencies are bundled in a lambda layer (currently you have to add the dependency as well to the lambda layer `package.json` yourself), this package defines the required packages itself. However, due to hoisting, they are not included in the actual deployment package of the lambda function. If you want to omit the lambda layer, disable hoisting for this package or remove it from the yarn workspace. Then this package will be self-supporting and include all dependencies in the deployment package.