#!/usr/bin/env bash
# Backup MongoDB hằng ngày, giữ 7 bản gần nhất.
# Cron: 0 2 * * * /usr/local/bin/backup-mongo.sh >> /var/log/grade-tracker/backup.log 2>&1
set -euo pipefail

BACKUP_DIR="/var/backups/grade-tracker"
RETENTION_DAYS=7
DB_NAME="gradetracker"
STAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE="${BACKUP_DIR}/${DB_NAME}-${STAMP}.archive.gz"

# MONGO_URI đọc từ file chỉ root đọc được: /etc/grade-tracker/backup.env
# shellcheck source=/dev/null
source /etc/grade-tracker/backup.env

mkdir -p "$BACKUP_DIR"

mongodump --uri="$MONGO_URI" --archive="$ARCHIVE" --gzip --quiet

echo "[$(date -Is)] backup created: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# Xoá bản cũ hơn RETENTION_DAYS
find "$BACKUP_DIR" -name "${DB_NAME}-*.archive.gz" -type f -mtime +${RETENTION_DAYS} -print -delete

# Khôi phục:
#   mongorestore --uri="$MONGO_URI" --archive=/var/backups/grade-tracker/xxx.archive.gz --gzip --drop
