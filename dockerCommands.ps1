docker build -t server-vibetd -f ./server/Dockerfile .
docker tag server-vibetd bhonprivate.azurecr.io/server-vibetd
docker push bhonprivate.azurecr.io/server-vibetd