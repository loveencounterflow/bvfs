
# Bric-A-Brac File Mirror (to be renamed)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Bric-A-Brac File Mirror (to be renamed)](#bric-a-brac-file-mirror-to-be-renamed)
  - [FUSE Driver](#fuse-driver)
  - [Adaptation of the SQLiteFS Driver](#adaptation-of-the-sqlitefs-driver)
  - [Additions to the SQLiteFS Driver](#additions-to-the-sqlitefs-driver)
  - [Versioning](#versioning)
  - [Operational Characteristics](#operational-characteristics)
    - [Closed and Opened Modes](#closed-and-opened-modes)
    - [Other](#other)
  - [File System Manipulation via SQL](#file-system-manipulation-via-sql)
  - [To Do](#to-do)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



# Bric-A-Brac File Mirror (to be renamed)

## FUSE Driver

* [SQLiteFS](https://github.com/narumatt/sqlitefs), (henceforth 'the SQLiteFS driver'), is an adapter for a
  [FUSE (*Filesystem in Userspace*)](https://en.wikipedia.org/wiki/Filesystem_in_Userspace) filesystem
  written in Rust that, when mounted in an empty directory will keep the tree structure, file contents and
  file metadata in an SQLite database file (henceforth 'the SQLiteFS DB (file)').

* Driver `sqlite-fs` (\~5,800_000 bytes) compiled for Linux 6.8 on AMD64 included but may have to be
  recompiled from sources for other architectures or kernel versions.

## Adaptation of the SQLiteFS Driver

* Original source has been adapted (in [my version of
  SQLiteFS](https://github.com/loveencounterflow/sqlitefs)) for the purposes of development and
  distribution; as such, it is compatible with the original version which may be used where preferrable.

* *Changes* include:

  * All `atime` values have been set to always use UNIX epoch (Thursday, 1. January 1970 00:00:00;
    timestamp zero) to avoid the act of merely *reading* a file to be recorded to become recorded in the
    SQLiteFS DB and hence in the git repo state.

## Additions to the SQLiteFS Driver

* The DB file produced by the SQLiteFS driver uses four tables ( `data`, `dentry`, `metadata`, `xattr`) to
  capture all data to operate a Linux file system.

* Bric-A-Brac File Mirror adds some more tables and views to simplify DB-based access to the file system:
  (table) `bb_fs_object_types`, (table) `bb_protocol_prefixes`, and (view) `bb_paths`.
  * `bb_protocol_prefixes` contains a list of known protocols with their URL prefixes and directory names.
  * `bb_paths` provides a neat listing of all DB objects (except for `.` and `..` entries) together with
    their file ID, type, name, full path and so on.

* These additions to the SQLiteFS DB are loaded transparently where needed and will be presisted into any
  SQLiteFS DB file used with Bric-A-Brac File Mirror; they do not need the modified FS driver version.

## Versioning

* The purpose of a Bric-A-Brac File Mirror is to enable a cache of files kept within a single DB file. As
  such, one could add **(1)**&nbsp;the *files of the mounted file system* for versioning, or else
  **(2)**&nbsp;the *SQLiteFS DB file*.

* Both solutions are unfortunate:
  * Versioning the mounted file system presupposes it is within a git repo.
  * Versioning with git will loose [Extended File
    Attributes](https://en.wikipedia.org/wiki/Extended_file_attributes), which can potentially allow
    Bric-A-Brac File Mirror to associate metadata with files that are mirrored and then copied into a user's
    project's file tree.
  * As a binary file, the SQLiteFS DB file is not well suited for versioning; changes small and big, trifle
    and substantial all become smooshed together into indistinct 'something is different here' commits.

* For this reason, *full DB dumps* (produced by `sqlite3 bricabracfs.sqlite ".dump" > bricabracfs.dump`) are
  used for versioning instead.
  * Versioning DB dumps means that file metadata such as access and modification times become part of the
    object data, prompting the [Adaptations](#adaptation-of-the-sqlitefs-driver) mentioned above.
  * A corrollary of this is that the SQLiteFS DB proper can be and sometimes will have to be reconstructed
    from a dump using the inverse of the above, `sqlite3 bricabracfs.sqlite < bricabracfs.dump`. In a way,
    we now have an entire file system contained in a human-readable text file, which is cool.


## Operational Characteristics

### Closed and Opened Modes

* necessity to store desired destination file permissions separately as the file permissions in storage are
  used for the file system's operation

### Other

```coffee
get_sha1 = ( text ) ->
  CRYPTO = require 'crypto'
  return ( ( CRYPTO.createHash 'sha1' ).update text ).digest 'hex'

debug 'Ωcrypto___6', get_sha1 'hello, world!'
debug 'Ωcrypto___7', '1f09d30c707d53f3d16c530dd73d70a6ce7596a9'

help 'Ωcrypto__12', ( Buffer.from 'f0ab9d80f0ab9d81f0ab9d83', 'hex' ).toString()
help 'Ωcrypto__12', ( Buffer.from '𫝃𫝄𫝅𫝇', 'utf-8' ).toString 'hex'
```

```bash
grep -Pi 'sqlitefs|' /etc/mtab
```

expect output:

```
sqlitefs /path/to/mount ...
```

## File System Manipulation via SQL

```
select mode from metadata where id = 12;

 .rw--w---- 33168 100620 1000000110010000
 .rw--w--w- 33170 100622 1000000110010010
 .r---w--w- 33042 100622 1000000100010010
 .r---w--w- 32786 100022 1000000000010010
 .rw-rw-r-- 33204 100664 1000000110110100
                     ugo
                         1234
                             111
                                u  g  o
                                rwx......
                                ...rwx...
                                ......rwx
```

* when FS is open:
  * all folders have `0o775` (`drwxrwxr-x`)
  * all   files have `0o664` (`.rw-rw-r--`)
    * later: provisions for executable files, `setuid` &c.
    * take care to exclude symlinks (reflect permissions of thir target)
* when FS is closed:
  * all folders have `0o555` (`dr-xr-xr-x`)
  * all   files have `0o444` (`.r--r--r--`)



```sql
p & 0xfe00 /* 0o177000 0b1111111_000_000_000 */ | 0x01fd /* 0o775 drwxrwxr-x folder open */
p & 0xfe00 /* 0o177000 0b1111111_000_000_000 */ | 0x01b4 /* 0o664 .rw-rw-r-- file open */
p & 0xfe00 /* 0o177000 0b1111111_000_000_000 */ | 0x016d /* 0o555 dr-xr-xr-x folder closed */
p & 0xfe00 /* 0o177000 0b1111111_000_000_000 */ | 0x0124 /* 0o444 .r--r--r-- file closed */

p = p | 0b0000000_010_010_000 /* = 0o000220 = 0x0090: folder, file open */
p = p & 0b1111111_101_101_111 /* = 0o177557 = 0xff6f: folder, file closed */
```




## To Do

* **`[—]`** do not modify source code of [SQLiteFS](https://github.com/narumatt/sqlitefs); instead, run SQL
  to change `atime`s as seen fit for purpose prior to `sqlite3 '.dump'`ing the DB


