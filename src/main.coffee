


'use strict'

#===========================================================================================================
GUY                       = require 'guy'
{ alert
  debug
  help
  info
  plain
  praise
  urge
  warn
  whisper }               = GUY.trm.get_loggers 'demo-execa'
{ rpr
  inspect
  echo
  reverse
  log     }               = GUY.trm
#-----------------------------------------------------------------------------------------------------------
SFMODULES                     = require '../../../apps/bricabrac-sfmodules'
{ type_of,                  } = SFMODULES.unstable.require_type_of()
{ Dbric,
  SQL,
  internals,                } = SFMODULES.unstable.require_dbric()
#-----------------------------------------------------------------------------------------------------------
PATH                          = require 'node:path'
{ execaSync,                } = require 'execa'
{ freeze,                   } = Object


#===========================================================================================================
shell_cfg_template:
  lines:              false
  #.........................................................................................................
  only_stdout:        false
  decode_octal:       false


#===========================================================================================================
class Shell

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    @cfg = freeze { shell_cfg_template..., cfg..., }
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _validate_call_arguments: ( cfg, cmd, parameters... ) ->
    # whisper 'Ωbvfs__32', { cfg, cmd, parameters, }
    switch type = type_of cfg
      when 'text'
        if cmd is undefined then  [ cfg, cmd, parameters..., ] = [ {}, cfg,       parameters..., ]
        else                      [ cfg, cmd, parameters..., ] = [ {}, cfg, cmd,  parameters..., ]
      when 'pod'  then null
      else throw new Error "Ωbvfs__33 expected a pod or a text, got a #{type}"
    #.......................................................................................................
    unless ( type = type_of cmd ) is 'text'
      throw new Error "Ωbvfs__34 expected a text, got a #{type}"
    #.......................................................................................................
    cfg = { @cfg..., cfg..., }
    # info 'Ωbvfs__35', { cfg, cmd, parameters, }
    return { cfg, cmd, parameters, }

  #---------------------------------------------------------------------------------------------------------
  call: ( cfg, cmd, parameters... ) ->
    { cfg, cmd, parameters, } = @_validate_call_arguments cfg, cmd, parameters...
    # debug 'Ωbvfs__36', cfg
    R         = execaSync cmd, parameters, cfg
    # debug 'Ωbvfs__37', R
    # if cfg.decode_octal
    #   if cfg.lines then R.stdout = ( decode_octal line for line in R.stdout )
    #   else              R.stdout = decode_octal R.stdout
    return R.stdout if cfg.only_stdout
    return R

  #---------------------------------------------------------------------------------------------------------
  decode_octal: ( text ) -> text.replace /(?<!\\)\\([0-7]{3})/gv, ( $0, $1 ) ->
    return String.fromCodePoint parseInt $1, 8

#===========================================================================================================
module.exports = {
  Shell, }
