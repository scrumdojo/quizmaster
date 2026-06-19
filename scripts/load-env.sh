_existing_BE_PORT=${BE_PORT-}
_existing_BE_PORT_SET=${BE_PORT+x}
_existing_FE_PORT=${FE_PORT-}
_existing_FE_PORT_SET=${FE_PORT+x}
_existing_DB_HOST=${DB_HOST-}
_existing_DB_HOST_SET=${DB_HOST+x}
_existing_DB_NAME=${DB_NAME-}
_existing_DB_NAME_SET=${DB_NAME+x}
_existing_DB_USER=${DB_USER-}
_existing_DB_USER_SET=${DB_USER+x}
_existing_DB_PASS=${DB_PASS-}
_existing_DB_PASS_SET=${DB_PASS+x}
_existing_DB_SCHEMA=${DB_SCHEMA-}
_existing_DB_SCHEMA_SET=${DB_SCHEMA+x}

for _f in ./.env ../.env; do [ -f "$_f" ] && . "$_f" && break; done

[ -n "$_existing_BE_PORT_SET" ] && BE_PORT=$_existing_BE_PORT
[ -n "$_existing_FE_PORT_SET" ] && FE_PORT=$_existing_FE_PORT
[ -n "$_existing_DB_HOST_SET" ] && DB_HOST=$_existing_DB_HOST
[ -n "$_existing_DB_NAME_SET" ] && DB_NAME=$_existing_DB_NAME
[ -n "$_existing_DB_USER_SET" ] && DB_USER=$_existing_DB_USER
[ -n "$_existing_DB_PASS_SET" ] && DB_PASS=$_existing_DB_PASS
[ -n "$_existing_DB_SCHEMA_SET" ] && DB_SCHEMA=$_existing_DB_SCHEMA

: ${BE_PORT:=8080}
: ${FE_PORT:=5173}

# Gradle requires Java 21. Prefer an explicit JAVA_HOME; otherwise use Homebrew openjdk@21.
if [ -z "${JAVA_HOME:-}" ]; then
    for _java_home in \
        /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
        /usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home; do
        if [ -x "$_java_home/bin/java" ]; then
            JAVA_HOME="$_java_home"
            break
        fi
    done
    unset _java_home
fi
if [ -n "${JAVA_HOME:-}" ]; then
    export JAVA_HOME
    export PATH="$JAVA_HOME/bin:$PATH"
fi
