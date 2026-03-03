ARG base_image=migrate/migrate:4

# hadolint ignore=DL3006
FROM ${base_image} AS release

WORKDIR /
COPY ./scripts ./scripts
COPY --chown=node:node ./migrate.sh ./migrate.sh
RUN chmod u+x migrate.sh
ENTRYPOINT ["/bin/sh"]
CMD ["./migrate.sh"]
STOPSIGNAL SIGTERM
