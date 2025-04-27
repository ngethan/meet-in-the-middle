# pull base image
FROM node:20-slim

# set our node environment, either development or production
# defaults to production, compose overrides this to development on build and run
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# default to port 3000 for node
ARG PORT=3000
ENV PORT $PORT
EXPOSE $PORT

# install global packages
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH /home/node/.npm-global/bin:$PATH
RUN npm i --unsafe-perm --allow-root -g npm@latest expo-cli@latest

# install dependencies first, in a different location for easier app bind mounting for local development
# due to default /opt permissions we have to create the dir with root and change perms
RUN mkdir /app
WORKDIR /app
ENV PATH /app/.bin:$PATH
COPY package.json package-lock.json ./
RUN npm install

# copy in our source code last, as it changes the most
COPY . .

ENTRYPOINT ["npm", "run"]
CMD ["start"]