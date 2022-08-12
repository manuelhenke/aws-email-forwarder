# aws-email-forwarder-dependencies

This package is used to get bundled as lambda layer. It is part of the yarn workspace, but disables hoisting. `node_modules` needs to include the actual packages provided through this layer. For a better development experience and to avoid compile/build errors, you have to include the dependencies for the different functions in their respective `package.json` as well. The dependency `aws-sdk` is omitted in this layer, because it's provided by default in the Lambda Function execution environment.
