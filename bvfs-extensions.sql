
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

-- ---------------------------------------------------------------------------------------------------------
drop view if exists bv_standard_modes;
create view if not exists bv_standard_modes as select
    p.file_id                               as file_id,
    case p.category
      when 'R' then p.upper_bits | 0x01ff
      when 'D' then p.upper_bits | 0x01fd
      when 'F' then p.upper_bits | 0x01b4
      else m.mode end                       as open_mode,
    case p.category
      when 'R' then p.upper_bits | 0x01ff
      when 'D' then p.upper_bits | 0x016d
      when 'F' then p.upper_bits | 0x0124
      else m.mode end                       as closed_mode
  from bv_paths as p
  join metadata as m where ( p.file_id = m.id );
-- .........................................................................................................
select * from bv_standard_modes where false; -- Gaps & Islands ESSFRI

-- ---------------------------------------------------------------------------------------------------------
drop view if exists bv_list;
create view if not exists bv_list as select
    m.id                                as file_id,
    p.parent_id                         as parent_id,
    p.type                              as type,
    p.category                          as category,
    p."(file_type)"                     as "(file_type)",
    p.upper_bits                        as upper_bits,
    m.mode                              as mode,
    s.open_mode                         as open_mode,
    s.closed_mode                       as closed_mode,
    format( '0o%06.o', m.mode         ) as mode_o,
    format( '0o%06.o', s.open_mode    ) as open_mode_o,
    format( '0o%06.o', s.closed_mode  ) as closed_mode_o,
    case m.mode
      when s.open_mode    then  'O'
      when s.closed_mode  then  'C'
      else                      '?' end as access,
    p.name                              as name,
    p.path                              as path
  from      bv_paths          as p
  left join metadata          as m on ( p.file_id = m.id )
  left join bv_standard_modes as s using ( file_id )
  order by p.path;
-- .........................................................................................................
select * from bv_list where false; -- Gaps & Islands ESSFRI

-- ---------------------------------------------------------------------------------------------------------
drop table if exists bv_cids;
create table if not exists bv_cids (
    file_id     integer unique not null,
    cid         text,
  foreign key ( file_id ) references metadata( id ) on delete cascade,
  primary key ( file_id ) );

-- ---------------------------------------------------------------------------------------------------------
drop view if exists _bv_lines_1;
create view _bv_lines_1 as select
    md.id                                       as file_id,
    coalesce( dt.block_num, 0 )                 as block_num,
    md.size                                     as size,
    max( 0, md.size + 4096 + sum( -4096 ) over ( w1 ) )  as delta_byte_count,
    dt.data                                     as data
  from metadata       as md
  left join data      as dt on ( md.id = dt.file_id )
  left join bv_paths  as pt using ( file_id )
  where pt.type in ( 'file' )
  window w1 as ( partition by dt.file_id order by dt.block_num );
-- .........................................................................................................
select * from _bv_lines_1 where false; -- Gaps & Islands ESSFRI

-- ---------------------------------------------------------------------------------------------------------
drop view if exists _bv_lines_2;
create view _bv_lines_2 as select
    b1.file_id                                  as file_id,
    b1.block_num                                as block_num,
    -- b1.size                                     as size,
    -- b1.delta_byte_count                         as delta_byte_count,
    case when b1.delta_byte_count < 4096
      then substring( b1.data, 1, b1.delta_byte_count ) -- NOTE `substring( blob )` returns blob
      else b1.data end                          as data
  from _bv_lines_1 as b1;
-- .........................................................................................................
select * from _bv_lines_2 where false; -- Gaps & Islands ESSFRI

-- ---------------------------------------------------------------------------------------------------------
drop view if exists _bv_lines_3;
create view _bv_lines_3 as with recursive
  input( file_id, block_num, x ) as ( select file_id, block_num, data from _bv_lines_2 order by file_id, block_num ),
  delimiter( d )  as ( values( x'0a' ) ),
  split( file_id, block_num, strip_nr, strip, eol, remainder ) as (
    select
      file_id,
      block_num,
      1,
      substr( x, 1, case instr( x, d ) when 0 then length( x ) else instr( x, d ) - 1 end ),
      case instr( x, d ) when 0 then x'' else substr( x, instr( x, d ), length( d ) ) end,
      case instr( x, d ) when 0 then null else substr( x, instr( x, d ) + length( d ) ) end
    from input, delimiter
    union all
    select
      file_id,
      block_num,
      strip_nr + 1,
      substr( remainder, 1, case instr( remainder, d ) when 0 then length( remainder ) else instr( remainder ,d ) - 1 end ),
      case instr( remainder, d ) when 0 then x'' else substr( remainder, instr( remainder, d ), length( d ) ) end,
      case instr( remainder, d ) when 0 then null else substr( remainder, instr( remainder,d ) + length( d ) ) end
    from split, delimiter
    where remainder is not null
  )
  select
      file_id,
      block_num,
      strip_nr,
      strip,
      eol
    from split
    order by file_id, block_num, strip_nr;
-- .........................................................................................................
select * from _bv_lines_3 where false; -- Gaps & Islands ESSFRI

-- ---------------------------------------------------------------------------------------------------------
select
    file_id,
    p.name,
    block_num,
    -- size,
    -- delta_byte_count,
    quote( cast( substring( data, 1, 309 ) as text ) )                 as head,
    quote( cast( substring( data, length( data ) - 309 ) as text ) )   as tail,
    -- quote( cast( data as text ) )                 as data,
    length( data )                                  as length
  from _bv_lines_2
  join bv_paths as p using ( file_id )
  order by file_id, block_num;
  -- from _bv_lines_2 where file_id = 3;

-- ---------------------------------------------------------------------------------------------------------
select
    file_id,
    block_num,
    -- size,
    -- delta_byte_count,
    substring( data, 1, 50 )
  from _bv_lines_1 order by file_id;

-- ---------------------------------------------------------------------------------------------------------
select
    file_id,
    block_num,
    strip_nr,
    -- json_quote( cast( ( coalesce( strip, x'' ) ) as text ) ) as strip,
    json_quote( cast( ( strip ) as text ) ) as strip,
    json_quote( cast( eol as text ) ) as eol,
    typeof( strip ),
    typeof( eol )
  from _bv_lines_3
  order by file_id, block_num, strip_nr;

-- ---------------------------------------------------------------------------------------------------------
-- ---------------------------------------------------------------------------------------------------------
drop table if exists bv_strips;
create table bv_strips (
    file_id     integer not null,
    block_num   integer not null,
    strip_nr    integer not null,
    strip       text    not null,
    eol         text    not null,
  primary key ( file_id, block_num, strip_nr ) );

-- ---------------------------------------------------------------------------------------------------------
insert into bv_strips ( file_id, block_num, strip_nr, strip, eol ) values
  ( 1, 1, 1, '(1)This is the first line.', '"\n"'->>'$' ),
  ( 1, 1, 2, '(2)First part of second line', '' ),
  ( 1, 2, 1, '(3) and heres the second part.', '"\n"'->>'$' ),
  ( 1, 2, 2, '(4)The 3rd line ', '' ),
  ( 1, 3, 1, '(5)extends ', '' ),
  ( 1, 4, 1, '(6)over three strips in three blocks', '"\n"'->>'$' ),
  ( 2, 4, 2, '(7)This is the first line.', '"\n"'->>'$' ),
  ( 2, 4, 3, '(8)First part of second line', '' ),
  ( 2, 5, 1, '(9) and heres the second part.', '"\n"'->>'$' ),
  ( 2, 5, 2, '(10)The 3rd line ', '' ),
  ( 2, 6, 1, '(11)extends ', '' ),
  ( 2, 7, 1, '(12)over three strips in three blocks', '"\n"'->>'$' );

-- ---------------------------------------------------------------------------------------------------------
.mode json
-- select file_id, block_num, strip_nr, strip, json_quote( eol ) from bv_strips;
select file_id, block_num, strip_nr, strip, eol from bv_strips;
.mode qbox --wrap 100 --wordwrap off

-- ---------------------------------------------------------------------------------------------------------
drop table if exists _bv_lines_matcher;
create table _bv_lines_matcher (
    file_id     integer not null,
    line_nr     integer not null,
    line        text    not null,
    eol         text    not null,
  primary key ( file_id, line_nr ) );

-- ---------------------------------------------------------------------------------------------------------
insert into _bv_lines_matcher ( file_id, line_nr, line, eol ) values
  ( 1, 1, '(1)This is the first line.', '"\n"'->>'$' ),
  ( 1, 2, '(1)First part of second line(1) and heres the second part.', '"\n"'->>'$' ),
  ( 1, 3, '(1)The 3rd line (1)extends (1)over three strips in three blocks', '"\n"'->>'$' ),
  ( 2, 1, '(1)This is the first line.', '"\n"'->>'$' ),
  ( 2, 2, '(1)First part of second line(1) and heres the second part.', '"\n"'->>'$' ),
  ( 2, 3, '(1)The 3rd line (1)extends (1)over three strips in three blocks', '"\n"'->>'$' );

-- ---------------------------------------------------------------------------------------------------------
.mode json
-- select file_id, line_nr, line, json_quote( eol ) from _bv_lines_matcher;
select file_id, line_nr, line, eol from _bv_lines_matcher;
.mode qbox --wrap 100 --wordwrap off

-- ---------------------------------------------------------------------------------------------------------
-- thx to https://chatgpt.com/s/t_692199a5be58819195de8b63a76e74fb
drop view if exists _bv_lines_4;
create view _bv_lines_4 as with recursive
  -- .......................................................................................................
  -- 1) Ordered strips with a global row number per file
  ordered as (
    select
      file_id,
      block_num,
      strip_nr,
      strip,
      eol,
      row_number() over (
        partition by file_id
        order by block_num, strip_nr
      ) as rn
    -- from bv_strips
    from _bv_lines_3
  ),
  -- .......................................................................................................
  -- 2) Recursive concatenation
  lines(file_id, rn, line_nr, line, eol) as (
    -- Base case: first strip becomes line 1
    -- .....................................................................................................
    select
        file_id,
        rn,
        1 as line_nr,
        strip as line,
        eol
    from ordered
    where rn = 1
    -- .....................................................................................................
    union all select -- Recursive step
        o.file_id,
        o.rn,
        -- .................................................................................................
        case -- Start a new line when we encounter eol from the previous strip
          when l.eol != x'' then l.line_nr + 1
          else l.line_nr
        end as line_nr,
        -- .................................................................................................
        case -- Append to current line unless previous strip ended a line
          when l.eol != x'' then o.strip
          else l.line || o.strip
        end as line,
        -- .................................................................................................
        o.eol -- Current strip's eol becomes the state for next recursion
      -- ...................................................................................................
      from lines l
      join ordered o on ( o.file_id = l.file_id ) and ( o.rn = l.rn + 1 ) )
  -- .......................................................................................................
  -- 3) Select only completed logical lines (those that ended on an eol)
  select
      file_id,
      line_nr,
      coalesce( cast( line as text ), '' ) as line,
      -- coalesce( line, x''                ) as line_bytes, -- not meant for production
      coalesce( cast( eol  as text ), '' ) as eol
  from lines;

-- ---------------------------------------------------------------------------------------------------------
drop view if exists bv_lines;
-- create view bv_lines as select
--     bl.file_id,
--     bl.line_nr,
--     bl.line,
--     bl.eol
--   from _bv_lines_4 as bl
--   right join metadata as md on ( bl.file_id = md.id )
--   order by file_id, line_nr;

create view bv_lines as select
    bp.file_id                as file_id,
    coalesce( bl.line_nr, 1 ) as line_nr,
    bp.name                   as name,
    md.size                   as size,
    coalesce( bl.line, ''  )  as line,
    coalesce( bl.eol, ''   )  as eol
  from metadata as md
  left join bv_paths as bp on ( md.id = bp.file_id )
  left join _bv_lines_4 as bl using ( file_id )
  where true
    and ( bp.type in ( 'file' ) )
    -- and ( line_nr = 1 )
  order by file_id, line_nr;


.mode box --wrap off --quote
-- select file_id, line_nr, line, substr( line_bytes, 1, 10 ), json_quote( eol ) as eol from _bv_lines_4 order by 1, 2;
select file_id, line_nr, line, json_quote( eol ) as eol from bv_lines;





select * from bv_paths order by file_id;
