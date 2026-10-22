CREATE TABLE IF NOT EXISTS tsf_objects (
 key TEXT PRIMARY KEY, etag TEXT NOT NULL, size INTEGER NOT NULL, content_type TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tsf_chunks (
 object_key TEXT NOT NULL, etag TEXT NOT NULL, part INTEGER NOT NULL, data BLOB NOT NULL,
 PRIMARY KEY(object_key, part), FOREIGN KEY(object_key) REFERENCES tsf_objects(key) ON DELETE CASCADE
);
