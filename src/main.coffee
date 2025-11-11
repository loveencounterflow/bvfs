


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
SFMODULES                     = require 'bricabrac-sfmodules'
{ type_of,                  } = SFMODULES.unstable.require_type_of()
{ Dbric,
  SQL,
  internals,                } = SFMODULES.unstable.require_dbric()
#-----------------------------------------------------------------------------------------------------------
PATH                          = require 'node:path'
{ execaSync,                } = require 'execa'
{ freeze,                   } = Object


#===========================================================================================================
shell_cfg_template =
  lines:              false # whether to return lists of lines for stdout, stderr
  reject:             true  # `true`: throw errors, `false`: return errors
  #.........................................................................................................
  ### extensions: ###
  only_stdout:        false # whether to only return `stdout`
  decode_octal:       false


#===========================================================================================================
class Shell

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    @cfg = freeze { shell_cfg_template..., cfg..., }
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _validate_call_arguments: ( cfg, cmd, parameters... ) ->
    # whisper 'Ωbvfs___1', { cfg, cmd, parameters, }
    switch type = type_of cfg
      when 'text'
        if cmd is undefined then  [ cfg, cmd, parameters..., ] = [ {}, cfg,       parameters..., ]
        else                      [ cfg, cmd, parameters..., ] = [ {}, cfg, cmd,  parameters..., ]
      when 'pod'  then null
      else throw new Error "Ωbvfs___2 expected a pod or a text, got a #{type}"
    #.......................................................................................................
    unless ( type = type_of cmd ) is 'text'
      throw new Error "Ωbvfs___3 expected a text, got a #{type}"
    #.......................................................................................................
    cfg = { @cfg..., cfg..., }
    # info 'Ωbvfs___4', { cfg, cmd, parameters, }
    return { cfg, cmd, parameters, }

  #---------------------------------------------------------------------------------------------------------
  call: ( cfg, cmd, parameters... ) ->
    { cfg, cmd, parameters, } = @_validate_call_arguments cfg, cmd, parameters...
    # debug 'Ωbvfs___5', cfg
    # cfg.reject = false
    try
      R         = execaSync cmd, parameters, cfg
    catch error
      debug 'Ωbvfs___6', rpr R?.stderr
      debug 'Ωbvfs___7', 'stderr          ', rpr error.stderr
      debug 'Ωbvfs___8', 'name            ', rpr error.name
      debug 'Ωbvfs___9', 'code            ', rpr error.code
      debug 'Ωbvfs__10', 'exitCode        ', rpr error.exitCode
      debug 'Ωbvfs__11', 'message         ', rpr error.message
      debug 'Ωbvfs__12', 'shortMessage    ', rpr error.shortMessage
      debug 'Ωbvfs__13', 'originalMessage ', rpr error.originalMessage
      debug 'Ωbvfs__14', 'cause           ', rpr error.cause
      throw error
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
