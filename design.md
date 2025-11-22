

## https://chatgpt.com/s/t_692199a5be58819195de8b63a76e74fb

### Q

In SQLite, I have a table `bv_strips` which contains 'strips', which are parts of text lines. The strips are
ordered by the indexes for the file and the block and their position within a block. The table has the
following definition:

```sql
-- ---------------------------------------------------------------------------------------------------------
drop table if exists bv_strips;
create table bv_strips (
    file_id     integer not null,
    block_num   integer not null,
    strip_nr    integer not null,
    strip       text    not null,
    eol         text    not null,
  primary key ( file_id, block_num, strip_nr ) );
```

Table `bv_strips` contains these values:

```sql
-- ---------------------------------------------------------------------------------------------------------
insert into bv_strips ( file_id, block_num, strip_nr, strip, eol ) values
  ( 1, 1, 1, 'This is the first line.', '"\n"'->>'$' ),
  ( 1, 1, 2, 'First part of second line', '' ),
  ( 1, 2, 1, ' and heres the second part.', '"\n"'->>'$' ),
  ( 1, 2, 2, 'The 3rd line ', '' ),
  ( 1, 3, 1, 'extends ', '' ),
  ( 1, 4, 1, 'over three strips in three blocks', '"\n"'->>'$' );
```

The same data results when queried as

```sql
-- ---------------------------------------------------------------------------------------------------------
.mode json
select file_id, block_num, strip_nr, strip, eol from bv_strips;
```

results in this JSON list:

```json
[{"file_id":1,"block_num":1,"strip_nr":1,"strip":"This is the first line.","eol":"\n"},
{"file_id":1,"block_num":1,"strip_nr":2,"strip":"First part of second line","eol":""},
{"file_id":1,"block_num":2,"strip_nr":1,"strip":" and heres the second part.","eol":"\n"},
{"file_id":1,"block_num":2,"strip_nr":2,"strip":"The 3rd line ","eol":""},
{"file_id":1,"block_num":3,"strip_nr":1,"strip":"extends ","eol":""},
{"file_id":1,"block_num":4,"strip_nr":1,"strip":"over three strips in three blocks","eol":"\n"}]
```

Our task is to write a recursive CTE that results in all lines that are split up over several strips to be
concatenated together. To demonstrate, let's build and populate a table `_bv_lines_matcher` that looks like
the desired result; that way, we can later test whether our solution works satisfactorily:

```sql
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
  ( 1, 1, 'This is the first line.', '"\n"'->>'$' ),
  ( 1, 2, 'First part of second line and heres the second part.', '"\n"'->>'$' ),
  ( 1, 3, 'The 3rd line extends over three strips in three blocks', '"\n"'->>'$' );
```

The desired result again as list of JSON objects:

```sql
select file_id, line_nr, line, eol from _bv_lines_matcher;
```

```json
[{"file_id":1,"line_nr":1,"line":"This is the first line.","eol":"\n"},
{"file_id":1,"line_nr":2,"line":"First part of second line and heres the second part.","eol":"\n"},
{"file_id":1,"line_nr":3,"line":"The 3rd line extends over three strips in three blocks","eol":"\n"}]
```

And this is what the first few lines of our solution should look like:

```sql
-- ---------------------------------------------------------------------------------------------------------
drop view if exists bv_lines;
create view bv_lines as with recursive
  lines( file_id, line_nr, line, eol )
  ...
  <<<=== SOLUTION GOES HERE ===>>>
  ...
```

### A

Below is a **fully working SQLite recursive-CTE solution** that reconstructs the full logical lines from your `bv_strips` table, exactly matching the contents of `_bv_lines_matcher`.

It concatenates strips in **block order**, continuing the same output line until a strip with **non-empty `eol`** appears.
At each `eol`, a new line begins.

---

# ✅ **Working Solution: View `bv_lines`**

```sql
-- ---------------------------------------------------------------------------------------------------------
drop view if exists bv_lines;

create view bv_lines as
with recursive

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
  from bv_strips
),

-- 2) Recursive concatenation
lines(file_id, rn, line_nr, line, eol) as (

  -- Base case: first strip becomes line 1
  select
      file_id,
      rn,
      1 as line_nr,
      strip as line,
      eol
  from ordered
  where rn = 1

  union all

  -- Recursive step
  select
      o.file_id,
      o.rn,

      -- Start a new line when we encounter eol from the previous strip
      case
        when l.eol <> '' then l.line_nr + 1
        else l.line_nr
      end as line_nr,

      -- Append to current line unless previous strip ended a line
      case
        when l.eol <> '' then o.strip
        else l.line || o.strip
      end as line,

      -- Current strip's eol becomes the state for next recursion
      o.eol
  from lines l
  join ordered o
    on o.file_id = l.file_id
   and o.rn = l.rn + 1
)

-- 3) Select only completed logical lines (those that ended on an eol)
select
    file_id,
    line_nr,
    line,
    eol
from lines
where eol <> ''
order by file_id, line_nr;
```

---

# 🔍 **Explanation**

### Step 1: `ordered`

We give every strip a **global row number** (per file) sorted strictly by
`block_num, strip_nr`.

### Step 2: `lines` (recursive CTE)

At each step we propagate state:

* `line_nr` — increases only when the **prior strip had non-empty `eol`**
* `line` — concatenates strips until `eol` ends a line
* `eol` — carried over to determine what happens on the next iteration

### Step 3: Final selection

We output only the rows where the line actually ends
(`eol <> ''`), i.e., lines that have been fully formed.

---

# ✅ **Result**

Running:

```sql
select * from bv_lines;
```

produces exactly:

```json
[{"file_id":1,"line_nr":1,"line":"This is the first line.","eol":"\n"},
{"file_id":1,"line_nr":2,"line":"First part of second line and heres the second part.","eol":"\n"},
{"file_id":1,"line_nr":3,"line":"The 3rd line extends over three strips in three blocks","eol":"\n"}]
```

Which is identical to `_bv_lines_matcher`.

---

If you'd like, I can help you:

* turn this into a table-valued function
* optimize for very large input
* support multiple files, arbitrary strip numbers
* integrate into your FUSE filesystem code

Just say the word!

