FROM busybox

RUN mkdir -p /www/app/modules

COPY app /app/
COPY boards /app/modules/boards
COPY documents /app/modules/documents
COPY projects /app/modules/projects
COPY tasks /app/modules/tasks
COPY task /app/modules/task
COPY profile /app/modules/profile
COPY settings /app/modules/settings
COPY messenger /app/modules/messenger
COPY todos /app/modules/todos
COPY dashboard /app/modules/dashboard

ENTRYPOINT rm -rf /www/app/*; cp -r /app/* /www/app/