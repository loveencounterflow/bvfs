-- #########################################################################################################
-- Splitting lines in SQL (is hard)
-- below code shows extraneous lines when used against big enough files; error seems to be in the
-- very last parts
-- ---------------------------------------------------------------------------------------------------------
drop view if exists _bv_lines_1;
create view _bv_lines_1 as select
    md.id                                               as file_id,
    coalesce( dt.block_num, 0 )                         as block_num,
    md.size                                             as size,
    max( 0, md.size + 4096 + sum( -4096 ) over ( w1 ) ) as delta_byte_count,
    dt.data                                             as data
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

/*
-- =========================================================================================================
  TESTING
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
*/

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
      join ordered o on ( o.file_id = l.file_id ) and ( o.rn = l.rn + 1 )
      )
  -- .......................................................................................................
  -- 3) Select only completed logical lines (those that ended on an eol)
  select
      file_id,
      line_nr,
      coalesce( cast( line as text ), '' ) as line,
      coalesce( cast( eol  as text ), '' ) as eol
      -- coalesce( line, x''                ) as line_bytes, -- not meant for production
      -- line,
      -- eol
  from lines
where ( eol <> x'' ) -- and ( eol is not null )
  ;

-- ---------------------------------------------------------------------------------------------------------
drop view if exists bv_lines;
create view bv_lines as select
    bp.file_id                as file_id,
    coalesce( bl.line_nr, 1 ) as line_nr,
    bp.name                   as name,
    bp.path                   as path,
    -- md.size                   as size,
    coalesce( bl.line, ''  )  as line,
    coalesce( bl.eol, ''   )  as eol
  from metadata as md
  left join bv_paths as bp on ( md.id = bp.file_id )
  left join _bv_lines_4 as bl using ( file_id )
  where true
    and ( bp.type in ( 'file' ) )
    -- and ( line_nr = 1 )
    -- and ( bl.eol != '' )
  order by file_id, line_nr;


-- -- ---------------------------------------------------------------------------------------------------------
-- select
--     file_id,
--     p.name,
--     block_num,
--     -- size,
--     -- delta_byte_count,
--     quote( cast( substring( data, 1, 309 ) as text ) )                 as head,
--     quote( cast( substring( data, length( data ) - 309 ) as text ) )   as tail,
--     -- quote( cast( data as text ) )                 as data,
--     length( data )                                  as length
--   from _bv_lines_2
--   join bv_paths as p using ( file_id )
--   order by file_id, block_num;
--   -- from _bv_lines_2 where file_id = 3;

-- -- ---------------------------------------------------------------------------------------------------------
-- select
--     file_id,
--     block_num,
--     -- size,
--     -- delta_byte_count,
--     substring( data, 1, 50 )
--   from _bv_lines_1 order by file_id;

-- -- ---------------------------------------------------------------------------------------------------------
-- select
--     file_id,
--     block_num,
--     strip_nr,
--     -- json_quote( cast( ( coalesce( strip, x'' ) ) as text ) ) as strip,
--     json_quote( cast( ( strip ) as text ) ) as strip,
--     json_quote( cast( eol as text ) ) as eol,
--     typeof( strip ),
--     typeof( eol )
--   from _bv_lines_3
--   order by file_id, block_num, strip_nr;


-- .mode box --wrap off --quote
-- select file_id, line_nr, line, substr( line_bytes, 1, 10 ), json_quote( eol ) as eol from _bv_lines_4 order by 1, 2;
-- select file_id, line_nr, line, json_quote( eol ) as eol from bv_lines;

