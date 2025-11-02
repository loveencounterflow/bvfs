<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Bric-A-Brac File Mirror (to be renamed)](#bric-a-brac-file-mirror-to-be-renamed)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->




# Bric-A-Brac File Mirror (to be renamed)




```coffee
get_sha1 = ( text ) ->
  CRYPTO = require 'crypto'
  return ( ( CRYPTO.createHash 'sha1' ).update text ).digest 'hex'

debug 'Ωcrypto___6', get_sha1 'hello, world!'
debug 'Ωcrypto___7', '1f09d30c707d53f3d16c530dd73d70a6ce7596a9'

help 'Ωcrypto__12', ( Buffer.from 'f0ab9d80f0ab9d81f0ab9d83', 'hex' ).toString()
help 'Ωcrypto__12', ( Buffer.from '𫝃𫝄𫝅𫝇', 'utf-8' ).toString 'hex'
```