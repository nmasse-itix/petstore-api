# Petstore API

## Setup

```sh
oc new-project petstore-api --display-name="Petstore API"
oc new-app openshift/nodejs~https://github.com/nmasse-itix/petstore-api.git
oc expose svc/petstore-api --hostname=petstore-api.app.itix.fr
```

```sh
3scale remote add -k 3scale-2.6 https://83aad0fd501707ebeca3ae03959bd4f7f35d4dba2c98b2f2008cc401fe235aff@3scale-admin.3scale-ci-26.app.itix.fr/
oc create secret generic 3scale-toolbox -n "petstore-api" --from-file="$HOME/.3scalerc.yaml"
```

Configure your APIcast gateways [to enable the CORS policy in the Global Policy Chain](https://www.itix.fr/blog/enable-global-policies-apicast/).

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
