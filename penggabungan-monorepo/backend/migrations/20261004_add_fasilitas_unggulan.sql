-- Existing database upgrade. Back up the database before applying once.
-- Fresh databases already receive this column from database.sql.
ALTER TABLE fasilitas
  ADD COLUMN unggulan TINYINT(1) NOT NULL DEFAULT 0 AFTER gambar;

-- Safe application rollback: deploy the prior application version; it ignores
-- this additive column. Do not drop the column after featured choices are saved.