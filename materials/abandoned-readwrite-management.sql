-- -- ---------------------------------------------------------------------------------------------------------
-- drop view if exists bv_standard_modes;
-- create view if not exists bv_standard_modes as select
--     p.file_id                               as file_id,
--     case p.category
--       when 'R' then p.upper_bits | 0x01ff
--       when 'D' then p.upper_bits | 0x01fd
--       when 'F' then p.upper_bits | 0x01b4
--       else m.mode end                       as open_mode,
--     case p.category
--       when 'R' then p.upper_bits | 0x01ff
--       when 'D' then p.upper_bits | 0x016d
--       when 'F' then p.upper_bits | 0x0124
--       else m.mode end                       as closed_mode
--   from bv_paths as p
--   join metadata as m where ( p.file_id = m.id );
-- -- .........................................................................................................
-- select * from bv_standard_modes where false; -- Gaps & Islands ESSFRI

/*
-- =========================================================================================================
-- READ/WRITE MANAGEMENT
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
*/

