
# BVFS

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [BVFS](#bvfs)
  - [FUSE Driver](#fuse-driver)
  - [Adaptation of the SQLiteFS Driver](#adaptation-of-the-sqlitefs-driver)
  - [Additions to the SQLiteFS Driver](#additions-to-the-sqlitefs-driver)
  - [Versioning](#versioning)
  - [Operational Characteristics](#operational-characteristics)
    - [Closed and Opened Modes](#closed-and-opened-modes)
    - [Other](#other)
  - [File System Manipulation via SQL](#file-system-manipulation-via-sql)
  - [See Also](#see-also)
  - [To Do](#to-do)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# BVFS

* The Bric-A-Brac Virtual File System, based on [SQLiteFS](https://github.com/narumatt/sqlitefs), stores
  local and remote resources in a single-file SQLite DB

* internal file system structure below the mount point reflects the local (`file://`) or remote (`http://`,
  `https://`) URL of origin

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

* in **open** access mode,
  * `R`' has `0o777` = `drwxrwxrwx` = `0x01ff` = `0b00000111111111` (owned by `root`)
  * `D`' has `0o775` = `drwxrwxr-x` = `0x01fd` = `0b00000111111101` (owned by user)
  * `F`' has `0o664` = `.rw-rw-r--` = `0x01b4` = `0b00000110110100` (owned by user)
* in **closed** access mode,
  * `R`' has `0o777` = `drwxrwxrwx` = `0x01ff` = `0b00000111111111` (owned by `root`)
  * `D`' has `0o555` = `dr-xr-xr-x` = `0x016d` = `0b00000101101101` (owned by user)
  * `F`' has `0o444` = `.r--r--r--` = `0x0124` = `0b00000100100100` (owned by user)





## See Also

* [`sqlar` and `sqlarfs`](https://sqlite.org/sqlar/doc/trunk/README.md) provide a FUSE-mountable archiv
  format in an SQLite DB file. On the pro side the implementation makes do with one table and an index by
  storing the paths directly as strings in the DB and the structure is simple and transparent. On the con
  side that also means that file manipulation tools can do very little beyond listing and reading files—for
  example, creating directories using the POSIX `mkdir` command in the virtual file system is not supported,
  a shortcoming that would have to be made up for by application code. Another shortcoming is that `ls` and
  `cd` apparently do not show folder hierarchies (that are present in the database), which is unacceptable.

* [`fossil fuefs`](https://sqlite.org/src/help?cmd=fusefs) is (confusingly) another FUSE file system from
  the makers of SQLite. It should mount a FOSSIL VCS archive as file system. The description is hedging its
  bets ("FuseFS typically only works on Linux, and then only on Linux systems that have the right kernel
  drivers and have installed the appropriate support libraries") and in fact trying to `fossil fusefs
  sqlar.fossil` produced `The FuseFS is not available in this build.`, and no further efforts were made.

* [`presslabs/gitfs`](https://github.com/presslabs/gitfs) is (was) an effort to make git repos mountable as
  file systems where any changes within that FS would be transparently committed and uploaded to a remote
  repo. Unfortunately it's also very much [abandonware](https://github.com/presslabs/gitfs/issues) like [a
  bunch of others](https://github.com/davesque/gitfuse).

* https://github.com/131/sqlfs

## To Do

* **`[—]`** do not modify source code of [SQLiteFS](https://github.com/narumatt/sqlitefs); instead, run SQL
  to change `atime`s as seen fit for purpose prior to `sqlite3 '.dump'`ing the DB

* **`[—]`** possible to generate files in the DB in a line-by-line fashion that then appear in the file tree
  when the BVFS is mounted?


