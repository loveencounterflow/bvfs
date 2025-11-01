
'use strict'

#===========================================================================================================
{ debug, }  = console


############################################################################################################
#
#===========================================================================================================
require_jetstream = ->
  { nameit,               } = ( require './various-brics' ).require_nameit()
  { type_of: _type_of,    } = ( require './unstable-rpr-type_of-brics' ).require_type_of()
  { hide,
    set_getter,           } = ( require './various-brics' ).require_managed_property_tools()

  #=========================================================================================================
  ### TAINT use proper typing ###
  type_of = ( x ) ->
    return  'sync_jetstream' if ( x instanceof       Jetstream )
    return 'async_jetstream' if ( x instanceof Async_jetstream )
    return _type_of x

  #---------------------------------------------------------------------------------------------------------
  misfit                  = Symbol 'misfit'
  jetstream_cfg_template  = { outlet: 'data#*', pick: 'all', fallback: misfit, }

  #=========================================================================================================
  class Selector
    constructor: ( selectors... ) ->
      { selectors_rpr,
        selectors,  } = _normalize_selectors selectors...
      @selectors_rpr  = selectors_rpr
      @data           = if selectors.size is 0 then true else false
      @cues           = false
      for selector from selectors
        switch true
          when selector is 'data#*' then @data = true
          when selector is 'cue#*' then @cues = true
          when ( match = selector.match /^data#(?<id>.+)$/ )?
            ### TAINT mention original selector next to normalized form ###
            throw new Error "Ωjstrm___1 IDs on data items not supported, got #{selector}"
          when ( match = selector.match /^cue#(?<id>.+)$/ )?
            @cues = new Set() if @cues in [ true, false, ]
            @cues.add match.groups.id
          else null
      @accept_all     = ( @data is true ) and ( @cues is true )
      return undefined

    #-------------------------------------------------------------------------------------------------------
    _get_excerpt: -> { data: @data, cues: @cues, accept_all: @accept_all, }

    #-------------------------------------------------------------------------------------------------------
    select: ( item ) ->
      return true if @accept_all
      if is_cue = ( typeof item ) is 'symbol'
        return true   if @cues is true
        return false  if @cues is false
        return @cues.has id_from_cue item
      return true   if @data is true
      return false  if @data is false
      throw new Error "Ωjstrm___2 IDs on data items not supported in selector #{rpr @toString}"
      # return @data.has id_from_value item

    #-------------------------------------------------------------------------------------------------------
    ### TAINT should provide method to generate normalized representation ###
    toString: -> @selectors_rpr

  #---------------------------------------------------------------------------------------------------------
  id_from_cue = ( symbol ) -> symbol.description

  #---------------------------------------------------------------------------------------------------------
  selectors_as_list = ( selectors... ) ->
    return [] if selectors.length is 0
    selectors = selectors.flat Infinity
    return [] if selectors.length is 0
    return [ '', ] if selectors.length is 1 and selectors[ 0 ] is ''
    selectors = selectors.join ','
    selectors = selectors.replace /\s+/g, '' ### TAINT not generally possible ###
    selectors = selectors.split ',' ### TAINT not generally possible ###
    return selectors

  #---------------------------------------------------------------------------------------------------------
  normalize_selectors = ( selectors... ) -> ( _normalize_selectors selectors... ).selectors

  #---------------------------------------------------------------------------------------------------------
  _normalize_selectors = ( selectors... ) ->
    selectors     = selectors_as_list selectors...
    selectors_rpr = selectors.join ', '
    R             = new Set()
    for selector in selectors
      switch true
        when selector is ''             then null
        when selector is '*'            then R.add "data#*"; R.add "cue#*"
        when selector is '#'            then R.add "cue#*"
        when /^#.+/.test selector       then R.add "cue#{selector}"
        when /.+#$/.test selector       then R.add "#{selector}*"
        when not /#/.test selector      then R.add "#{selector}#*"
        else R.add selector
    R.add 'data#*' if R.size is 0
    R.delete '' if R.size isnt 1
    return { selectors: R, selectors_rpr, }

  #---------------------------------------------------------------------------------------------------------
  _configure_transform = ( selectors..., tfm ) ->
    selector      = new Selector selectors...
    original_tfm  = tfm
    #.......................................................................................................
    switch type = type_of tfm
      #.....................................................................................................
      when 'sync_jetstream'
        is_sync = true
        tfm     = nameit '(sync_jetstream)', ( d ) ->
          return yield d unless selector.select d
          yield from original_tfm.walk d ;null
      #.....................................................................................................
      when 'async_jetstream'
        is_sync = false
        tfm     = nameit '(async_jetstream)', ( d ) ->
          return yield d unless selector.select d
          yield from await original_tfm.walk d ;null
      #.....................................................................................................
      when 'function'
        is_sync = true
        tfm     = nameit "(watcher)_#{original_tfm.name}", ( d ) ->
          return yield d unless selector.select d
          original_tfm d; yield d ;null
      #.....................................................................................................
      when 'asyncfunction'
        is_sync = false
        tfm     = nameit "(watcher)_#{original_tfm.name}", ( d ) ->
          return yield d unless selector.select d
          await original_tfm d; yield d ;null
      #.....................................................................................................
      when 'generatorfunction'
        is_sync = true
        tfm     = nameit "(generator)_#{original_tfm.name}", ( d ) ->
          return yield d unless selector.select d
          yield from original_tfm d ;null
      #.....................................................................................................
      when 'asyncgeneratorfunction'
        is_sync = false
        tfm     = nameit "(generator)_#{original_tfm.name}", ( d ) ->
          return yield d unless selector.select d
          yield from await original_tfm d ;null
      #.....................................................................................................
      else throw new Error "Ωjstrm___3 expected a jetstream or a synchronous function or generator function, got a #{type}"
    #.......................................................................................................
    return { tfm, original_tfm, type, is_sync, }


  #=========================================================================================================
  class Jetstream_abc

    #-------------------------------------------------------------------------------------------------------
    constructor: ( cfg ) ->
      ### TAINT use Object.freeze, push sets new array ###
      @configure cfg
      @transforms = []
      @shelf      = []
      return undefined

    #-------------------------------------------------------------------------------------------------------
    configure: ( cfg ) ->
      @cfg    = { jetstream_cfg_template..., cfg..., }
      @outlet = new Selector @cfg.outlet
      ;null

    #-------------------------------------------------------------------------------------------------------
    set_getter @::, 'length',   -> @transforms.length
    set_getter @::, 'is_empty', -> @transforms.length is 0

    #=======================================================================================================
    send: ( ds... ) -> @shelf.splice @shelf.length, 0, ds...  ;null
    cue:  ( id    ) -> @send Symbol.for id                    ;null

    #=======================================================================================================
    pick_first: ( P... ) -> @_pick 'first',   P...
    pick_last:  ( P... ) -> @_pick 'last',    P...
    pick_all:   ( P... ) -> @_pick 'all',     P...
    run:        ( P... ) -> @_pick @cfg.pick, P...

    #-------------------------------------------------------------------------------------------------------
    _pick_from_list: ( picker, values ) ->
      return values if picker is 'all'
      if values.length is 0
        throw new Error "Ωjstrm___6 no results" if @cfg.fallback is misfit
        return @cfg.fallback
      return values.at  0 if picker is 'first'
      return values.at -1 if picker is 'last'
      throw new Error "Ωjstrm___7 unknown picker #{picker}"

    #-------------------------------------------------------------------------------------------------------
    walk: ( ds... ) ->
      @send ds...
      return @_walk_and_pick()


  #=========================================================================================================
  class Jetstream       extends Jetstream_abc
  class Async_jetstream extends Jetstream_abc

  #=========================================================================================================
  ### NOTE this used to be the idiomatic formulation `R = [ ( @walk P... )..., ]`; for the sake of making
  sync and async versions maximally similar, the sync version has been adapted to the async formulation. My
  first async solution was `R = ( d for await d from genfn P... )`, which doesn't transpilenicely. ###
  ### thx to https://allthingssmitty.com/2025/07/14/modern-async-iteration-in-javascript-with-array-fromasync/ ###
  Jetstream::_pick       = ( picker, P... ) -> @_pick_from_list picker,       Array.from      @walk P...
  Async_jetstream::_pick = ( picker, P... ) -> @_pick_from_list picker, await Array.fromAsync @walk P...

  #=========================================================================================================
  Jetstream::_walk_and_pick = ->
    previous  = misfit
    count     = 0
    #.......................................................................................................
    for value from @_walk_all_to_exhaustion()
      count++
      if ( count is 1 ) and ( @cfg.pick is 'first' )
        yield value
      else if @cfg.pick is 'all'
        yield value
      previous = value
    #.......................................................................................................
    yield previous if ( @cfg.pick is 'last' ) and ( count > 0 )
    ;null

  #---------------------------------------------------------------------------------------------------------
  Async_jetstream::_walk_and_pick = ->
    previous  = misfit
    count     = 0
    #.......................................................................................................
    for await value from @_walk_all_to_exhaustion()
      count++
      if ( count is 1 ) and ( @cfg.pick is 'first' )
        yield value
      else if @cfg.pick is 'all'
        yield value
      previous = value
    #.......................................................................................................
    yield previous if ( @cfg.pick is 'last' ) and ( count > 0 )
    ;null

  #=========================================================================================================
  Jetstream::_walk_all_to_exhaustion = ->
    if @is_empty  then  yield                             @shelf.shift() while @shelf.length > 0
    else                yield from       @transforms[ 0 ] @shelf.shift() while @shelf.length > 0
    ;null

  #---------------------------------------------------------------------------------------------------------
  Async_jetstream::_walk_all_to_exhaustion = ->
    if @is_empty  then  yield                             @shelf.shift() while @shelf.length > 0
    else                yield from await @transforms[ 0 ] @shelf.shift() while @shelf.length > 0
    ;null

  #=========================================================================================================
  Jetstream::push = ( selectors..., tfm ) ->
    { tfm,
      is_sync,
      type,   } = _configure_transform selectors..., tfm
    unless is_sync
      throw new Error "Ωjstrm___8 cannot use async transform in sync jetstream, got a #{type}"
    my_idx      = @transforms.length
    #.......................................................................................................
    nxt         = null
    yielder     = null
    #.......................................................................................................
    R = nameit "(managed)_#{tfm.name}", do ( me = @ ) -> ( d ) ->
      unless nxt?
        nxt = me.transforms[ my_idx + 1 ]
        if nxt? then  yielder = ( d ) -> ( yield from       nxt j         ) for       j from tfm d ;null
        else          yielder = ( d ) -> ( yield j if me.outlet.select j  ) for       j from tfm d ;null
      #.....................................................................................................
      yield from yielder d ;null
    #.......................................................................................................
    @transforms.push R
    return R

  #---------------------------------------------------------------------------------------------------------
  Async_jetstream::push = ( selectors..., tfm ) ->
    { tfm,    } = _configure_transform selectors..., tfm
    my_idx      = @transforms.length
    #.......................................................................................................
    nxt         = null
    yielder     = null
    #.......................................................................................................
    R = nameit "(managed)_#{tfm.name}", do ( me = @ ) -> ( d ) ->
      unless nxt?
        nxt = me.transforms[ my_idx + 1 ]
        if nxt? then  yielder = ( d ) -> ( yield from await nxt j         ) for await j from tfm d ;null
        else          yielder = ( d ) -> ( yield j if me.outlet.select j  ) for await j from tfm d ;null
      #.....................................................................................................
      yield from await yielder d ;null
    #.......................................................................................................
    @transforms.push R
    return R

  #=========================================================================================================
  internals = Object.freeze {
    type_of,
    misfit,
    jetstream_cfg_template,
    Selector,
    _normalize_selectors,
    normalize_selectors,
    selectors_as_list,
    id_from_cue, }
  return exports = { Jetstream, Async_jetstream, internals, }



#===========================================================================================================
Object.assign module.exports, do => { require_jetstream, }
