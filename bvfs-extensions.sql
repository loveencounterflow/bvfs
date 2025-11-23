
/*
CREATE TABLE data(
    file_id int,
    block_num int,
    data blob,
  foreign key (file_id) references metadata(id) on delete cascade,
  primary key (file_id, block_num) )

CREATE TABLE dentry(
    parent_id int,
    child_id int,
    file_type int,
    name text,
  foreign key (parent_id) references metadata(id) on delete cascade,
  foreign key (child_id) references metadata(id) on delete cascade,
  primary key (parent_id, name) )

CREATE TABLE metadata(
  id integer primary key,
  size int default 0 not null,
  atime text,atime_nsec int,
  mtime text,mtime_nsec int,
  ctime text,ctime_nsec int,
  crtime text,crtime_nsec int,
  kind int,
  mode int,
  nlink int default 0 not null,
  uid int default 0,
  gid int default 0,
  rdev int default 0,
  flags int default 0 )

CREATE TABLE xattr(
    file_id int,
    name text,
    value text,
  foreign key (file_id) references metadata(id) on delete cascade,
  primary key (file_id, name) )
*/

-- ---------------------------------------------------------------------------------------------------------
drop table if exists bv_fs_object_types;
create table if not exists bv_fs_object_types (
    kind integer unique not null,
    name text unique,
  primary key ( kind )
);

-- .........................................................................................................
insert into bv_fs_object_types ( kind, name ) values
-- -: normal file
-- d: directory
-- l: symbolic link
-- c character device
-- p pseudo-terminal
-- b for a block device
-- s for a socket
  ( 0x1000, 'namedpipe'   ),
  ( 0x2000, 'chrdevice'   ),
  ( 0x4000, 'folder'      ),
  ( 0x6000, 'blockdevice' ),
  ( 0x8000, 'file'        ),
  ( 0xa000, 'symlink'     ),
  ( 0xc000, 'socket'      )
  on conflict ( kind ) do nothing;

-- ---------------------------------------------------------------------------------------------------------
drop table if exists bv_protocol_prefixes;
create table if not exists bv_protocol_prefixes (
    protocol  text unique not null,
    prefix    text unique not null,
  primary key ( protocol )
);

-- .........................................................................................................
insert into bv_protocol_prefixes ( protocol, prefix ) values
  ( 'https',  'https://'  ),
  ( 'http',   'http://'   ),
  ( 'file',   'file://'   )
  on conflict ( prefix ) do nothing;

-- ---------------------------------------------------------------------------------------------------------
drop table if exists bv_cids;
create table if not exists bv_cids (
    file_id     integer unique not null,
    cid         text,
  foreign key ( file_id ) references metadata( id ) on delete cascade,
  primary key ( file_id ) );

-- ---------------------------------------------------------------------------------------------------------
drop view if exists bv_paths;
create view if not exists bv_paths as with recursive
  bv_path_tree( parent_id, file_id, file_type, name, path ) as (
    -- .....................................................................................................
    -- Base case: top-level entries (parent_id NULL or 0, depending on your schema)
    select
        parent_id                                         as parent_id,
        child_id                                          as file_id,
        file_type                                         as file_type,
        name                                              as name,
        case name when '.' then '.' else name end         as path
      from dentry
      where true
        and ( parent_id is 1 )
        and ( name != '..' )
    -- .....................................................................................................
    union all
    -- .....................................................................................................
    -- Recursive case: append child names to their parent bv_paths
    select
        d.parent_id             as parent_id,
        d.child_id              as file_id,
        d.file_type             as file_type,
        d.name                  as name,
        p.path || '/' || d.name as path
      from dentry       as d
      join bv_path_tree as p on d.parent_id = p.file_id
      where true
        and ( d.name not in ( '.', '..' ) )
        and ( path != '.' ) )
  -- .......................................................................................................
  select
      q.file_id                                     as file_id,
      m.size                                        as size,
      q.parent_id                                   as parent_id,
      case when q.file_id is 1  then  'R' else
        case e.name
          when 'folder'         then  'D'
          when 'file'           then  'F'
          else                        'X' end end   as category,
      e.name                                        as type,
      q.file_type                                   as "(file_type)",
      ( m.mode & 0xfffffe00 )                       as upper_bits,
      q.name                                        as name,
      q.path                                        as path
    from bv_path_tree as q
    left join bv_fs_object_types as e on ( q.file_type = e.kind )
    join metadata as m on ( q.file_id = m.id );
-- .........................................................................................................
select * from bv_paths where false; -- Gaps & Islands ESSFRI






select * from bv_paths order by file_id;
select 'bvfs-extensions.sql has run to completion' as message;