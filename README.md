# Petstore API

## Setup

```sh
oc new-project petstore-api --display-name="Petstore API"
oc new-app openshift/nodejs~https://github.com/nmasse-itix/petstore-api.git
oc expose svc/petstore-api --hostname=petstore-api.app.itix.fr
```

```sh
3scale remote add -k 3scale-2.6 https://[REDACTED]@3scale-admin.3scale-ci-26.app.itix.fr/
oc create secret generic 3scale-toolbox -n "petstore-api" --from-file="$HOME/.3scalerc.yaml"
```

Configure your APIcast gateways [to enable the CORS policy in the Global Policy Chain](https://www.itix.fr/blog/enable-global-policies-apicast/).

```sh
oc new-build --strategy=pipeline https://github.com/nmasse-itix/petstore-api.git -e PRIVATE_BASE_URL=http://petstore-api.app.itix.fr -e NAMESPACE=petstore-api -e TARGET_INSTANCE=3scale-2.6 -e SECRET_NAME=3scale-toolbox -e OIDC_ISSUER_ENDPOINT=https://3scale:[REDACTED]@sso.app.itix.fr/auth/realms/3scale-26 -e DISABLE_TLS_VALIDATION=yes -e MOCK_SERVER=https://microcks.app.itix.fr -e MOCK_URL=/rest/test/0.9.0
```

## List all pets

```sh
curl http://localhost:8080/pets/
```

## Get a pet

```sh
curl http://localhost:8080/pets/1
curl http://localhost:8080/pets/2
```

## Create a pet

```sh
curl -XPOST http://localhost:8080/pets/ -H 'Content-Type: application/json' -d '{"name":"Raspoutine","tag":"dog"}'
```

## Update a pet

```sh
curl -XPUT http://localhost:8080/pets/3 -H 'Content-Type: application/json' -d '{"id":3,"name":"Daisy","tag":"turtle"}'
```

## Delete a pet

```sh
curl -XDELETE http://localhost:8080/pets/3
```
