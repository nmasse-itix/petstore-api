#!groovy

library identifier: '3scale-toolbox-jenkins@master', 
        retriever: modernSCM([$class: 'GitSCMSource',
                              remote: 'https://github.com/rh-integration/3scale-toolbox-jenkins.git',
                              traits: [[$class: 'jenkins.plugins.git.traits.BranchDiscoveryTrait']]])

def service = null

node("nodejs") {
  stage('Checkout Source') {
    checkout scm
    //git url: "https://github.com/nmasse-itix/petstore-api.git"
  }

  stage('Pre-requisites') {
    if (! fileExists('openapi-spec.yaml')) {

      echo """
      There is no OpenAPI Specification file!
      """

      error("Nothing to deploy!")
    }

    // Install pre-requisites
    sh """
    curl -L -o /tmp/jq https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64
    chmod 755 /tmp/jq
    """
  }

  stage("Deploy API in Dev") {
    // Prepare
    service = toolbox.prepareThreescaleService(
        openapi: [filename: "openapi-spec.yaml" ],
        environment: [ baseSystemName: "petstore",
                       environmentName: "dev",
                       oidcIssuerEndpoint: params.OIDC_ISSUER_ENDPOINT,
                       publicBasePath: "/",
                       privateBasePath: "/",
                       privateBaseUrl: params.PRIVATE_BASE_URL ],
        toolbox: [ openshiftProject: params.NAMESPACE,
                   destination: params.TARGET_INSTANCE,
                   image: "quay.io/redhat/3scale-toolbox:v0.16.2",
                   activeDeadlineSeconds: 180,
                   insecure: params.DISABLE_TLS_VALIDATION == "yes",
                   secretName: params.SECRET_NAME],
        service: [:],
        applications: [
            [ name: "petstore-app", description: "This is used for tests", plan: "test", account: "john" ]
        ],
        applicationPlans: [
          [ systemName: "test", name: "Test", defaultPlan: true, published: true ]
        ]
    )

    // A pre-release version needs to use the mock backend 
    if (service.openapi.majorVersion == "0") {
      service.environment.privateBaseUrl = params.MOCK_SERVER
      service.environment.privateBasePath = params.MOCK_URL
    }

    // Import OpenAPI
    service.importOpenAPI()
    echo "Service with system_name ${service.environment.targetSystemName} created !"

    // Create an Application Plan
    service.applyApplicationPlans()

    // Create an Application
    service.applyApplication()

    // Promote to production
    service.promoteToProduction()
  }

  // Terminate the pipeline earlier if the API is not yet production ready
  if (service.openapi.majorVersion == "0") {
    currentBuild.result = 'SUCCESS'
    return
  }

  stage("Deploy API in Test") {
    // Prepare
    service = toolbox.prepareThreescaleService(
        openapi: [filename: "openapi-spec.yaml" ],
        environment: [ baseSystemName: "petstore",
                       environmentName: "test",
                       oidcIssuerEndpoint: params.OIDC_ISSUER_ENDPOINT,
                       publicBasePath: "/",
                       privateBasePath: "/",
                       privateBaseUrl: params.PRIVATE_BASE_URL ],
        toolbox: [ openshiftProject: params.NAMESPACE,
                   destination: params.TARGET_INSTANCE,
                   image: "quay.io/redhat/3scale-toolbox:v0.16.2",
                   activeDeadlineSeconds: 180,
                   insecure: params.DISABLE_TLS_VALIDATION == "yes",
                   secretName: params.SECRET_NAME],
        service: [:],
        applications: [
            [ name: "petstore-app", description: "This is used for tests", plan: "test", account: "john" ]
        ],
        applicationPlans: [
          [ systemName: "test", name: "Test", defaultPlan: true, published: true ]
        ]
    )

    // Import OpenAPI
    service.importOpenAPI()
    echo "Service with system_name ${service.environment.targetSystemName} created !"

    // Create an Application Plan
    service.applyApplicationPlans()

    // Create an Application
    service.applyApplication()

    // Run integration tests
    runIntegrationTests(service)
    
    // Promote to production
    service.promoteToProduction()
  }

  stage("Deploy API in Prod") {
    // Prepare
    service = toolbox.prepareThreescaleService(
        openapi: [filename: "openapi-spec.yaml" ],
        environment: [ baseSystemName: "petstore",
                       environmentName: "prod",
                       oidcIssuerEndpoint: params.OIDC_ISSUER_ENDPOINT,
                       publicBasePath: "/",
                       privateBasePath: "/",
                       privateBaseUrl: params.PRIVATE_BASE_URL ],
        toolbox: [ openshiftProject: params.NAMESPACE,
                   destination: params.TARGET_INSTANCE,
                   image: "quay.io/redhat/3scale-toolbox:v0.16.2",
                   activeDeadlineSeconds: 180,
                   insecure: params.DISABLE_TLS_VALIDATION == "yes",
                   secretName: params.SECRET_NAME],
        service: [:],
        applications: [
            [ name: "petstore-app", description: "This is used for tests", plan: "test", account: "john" ]
        ],
        applicationPlans: [
          [ systemName: "test", name: "Test", defaultPlan: true, published: true ]
        ]
    )

    // Import OpenAPI
    service.importOpenAPI()
    echo "Service with system_name ${service.environment.targetSystemName} created !"

    // Create an Application Plan
    service.applyApplicationPlans()

    // Create an Application
    service.applyApplication()

    // Promote to production
    service.promoteToProduction()
  }

}

def runIntegrationTests(def service) {
  // To run the integration tests when using APIcast SaaS instances, we need
  // to fetch the proxy definition to extract the staging public url
  def proxy = service.readProxy("sandbox")

  // The integration tests will be a bit different depending on the security scheme
  // declared in the OpenAPI Specification file
  def getCredentialsCodeSnippet = null
  if (service.openapi.securityScheme.name() == "OPEN") {
    getCredentialsCodeSnippet = """
    credential_header="x-dummy: dummy"
    echo "no credential will be used"
    """
  } else if (service.openapi.securityScheme.name() == "APIKEY") {
    def userkey = service.applications[0].userkey
    getCredentialsCodeSnippet = """
    credential_header="api-key: ${userkey}"
    echo "userkey is ${userkey}"
    """
  } else if (service.openapi.securityScheme.name() == "OIDC") {
    def tokenEndpoint = getTokenEndpoint(params.OIDC_ISSUER_ENDPOINT)
    def clientId = service.applications[0].clientId
    def clientSecret = service.applications[0].clientSecret
    getCredentialsCodeSnippet = """
    echo "token endpoint is ${tokenEndpoint}"
    echo "client_id=${clientId}"
    echo "client_secret=${clientSecret}"
    curl -sfk "${tokenEndpoint}" -d client_id="${clientId}" -d client_secret="${clientSecret}" -d scope=openid -d grant_type=client_credentials -o response.json
    TOKEN="\$(/tmp/jq -r .access_token response.json)"
    echo "Received access_token '\$TOKEN'"
    credential_header="Authorization: Bearer \$TOKEN"
    """
  }

  // Run the actual tests
  sh """set -e
  echo "Public Staging Base URL is ${proxy.sandbox_endpoint}"
  ${getCredentialsCodeSnippet}
  curl -sfk -w "findPets: %{http_code}\n" -o /dev/null "${proxy.sandbox_endpoint}/pets" -H "\$credential_header"
  curl -sfk -w "findPetById: %{http_code}\n" -o /dev/null "${proxy.sandbox_endpoint}/pets/1" -H "\$credential_header"
  # This one is only present in v1.1 and onwards
  curl -sk -w "updatePet: %{http_code}\n" -o /dev/null "${proxy.sandbox_endpoint}/pets/1" -H "Content-Type: application/json" -XPUT -d '{"id":1,"name":"Raspoutine","tag":"dog"}' -H "\$credential_header"
  """
}

def getTokenEndpoint(String oidcIssuerEndpoint) {
   def m = (oidcIssuerEndpoint =~ /(https?:\/\/)[^:]+:[^@]+@(.*)/)
   return "${m[0][1]}${m[0][2]}/protocol/openid-connect/token"
}