#!/bin/bash
set -e
service postgresql start
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'password';\""
su - postgres -c "psql -c \"CREATE DATABASE kukkutpro;\"" || true
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/18/main/postgresql.conf
echo "host all all 0.0.0.0/0 md5" >> /etc/postgresql/18/main/pg_hba.conf
echo "host all all ::0/0 md5" >> /etc/postgresql/18/main/pg_hba.conf
echo "host all all 127.0.0.1/32 trust" >> /etc/postgresql/18/main/pg_hba.conf
echo "host all all ::1/128 trust" >> /etc/postgresql/18/main/pg_hba.conf
service postgresql restart
echo "POSTGRESQL_SETUP_SUCCESSFUL"
