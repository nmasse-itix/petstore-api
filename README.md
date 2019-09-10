# Petstore API

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
