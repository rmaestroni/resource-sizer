resource-sizer
==============

The resource-sizer is a Node.js HTTP server. Its job is to calculate the
Content-Length of a set of HTTP resources provided by clients.

The client can GET or POST an array of resources referenced by ```urls```,
for example
```
curl -d '{"urls": ["http://dawanda.com", "http://it.dawanda.com"] }' \
  -H 'Content-Type: application/json' http://localhost:8081
```

The server responds with
```
{"urls":["http://dawanda.com","http://it.dawanda.com"],"sizes":[95986,98577]}
```

## Run
node index.js
