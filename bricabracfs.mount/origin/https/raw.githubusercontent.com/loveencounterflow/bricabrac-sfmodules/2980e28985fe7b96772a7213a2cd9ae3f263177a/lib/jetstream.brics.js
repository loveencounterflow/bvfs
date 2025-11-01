(function() {
  'use strict';
  var debug, require_jetstream,
    splice = [].splice;

  //===========================================================================================================
  ({debug} = console);

  //###########################################################################################################

  //===========================================================================================================
  require_jetstream = function() {
    var Async_jetstream, Jetstream, Jetstream_abc, Selector, _configure_transform, _normalize_selectors, _type_of, exports, hide, id_from_cue, internals, jetstream_cfg_template, misfit, nameit, normalize_selectors, selectors_as_list, set_getter, type_of;
    ({nameit} = (require('./various-brics')).require_nameit());
    ({
      type_of: _type_of
    } = (require('./unstable-rpr-type_of-brics')).require_type_of());
    ({hide, set_getter} = (require('./various-brics')).require_managed_property_tools());
    //=========================================================================================================
    /* TAINT use proper typing */
    type_of = function(x) {
      if (x instanceof Jetstream) {
        return 'sync_jetstream';
      }
      if (x instanceof Async_jetstream) {
        return 'async_jetstream';
      }
      return _type_of(x);
    };
    //---------------------------------------------------------------------------------------------------------
    misfit = Symbol('misfit');
    jetstream_cfg_template = {
      outlet: 'data#*',
      pick: 'all',
      fallback: misfit
    };
    //=========================================================================================================
    Selector = class Selector {
      constructor(...selectors) {
        var match, ref, selector, selectors_rpr;
        ({selectors_rpr, selectors} = _normalize_selectors(...selectors));
        this.selectors_rpr = selectors_rpr;
        this.data = selectors.size === 0 ? true : false;
        this.cues = false;
        for (selector of selectors) {
          switch (true) {
            case selector === 'data#*':
              this.data = true;
              break;
            case selector === 'cue#*':
              this.cues = true;
              break;
            case (match = selector.match(/^data#(?<id>.+)$/)) != null:
              /* TAINT mention original selector next to normalized form */
              throw new Error(`Ωjstrm___1 IDs on data items not supported, got ${selector}`);
            case (match = selector.match(/^cue#(?<id>.+)$/)) != null:
              if ((ref = this.cues) === true || ref === false) {
                this.cues = new Set();
              }
              this.cues.add(match.groups.id);
              break;
            default:
              null;
          }
        }
        this.accept_all = (this.data === true) && (this.cues === true);
        return void 0;
      }

      //-------------------------------------------------------------------------------------------------------
      _get_excerpt() {
        return {
          data: this.data,
          cues: this.cues,
          accept_all: this.accept_all
        };
      }

      //-------------------------------------------------------------------------------------------------------
      select(item) {
        var is_cue;
        if (this.accept_all) {
          return true;
        }
        if (is_cue = (typeof item) === 'symbol') {
          if (this.cues === true) {
            return true;
          }
          if (this.cues === false) {
            return false;
          }
          return this.cues.has(id_from_cue(item));
        }
        if (this.data === true) {
          return true;
        }
        if (this.data === false) {
          return false;
        }
        throw new Error(`Ωjstrm___2 IDs on data items not supported in selector ${rpr(this.toString)}`);
      }

      // return @data.has id_from_value item

        //-------------------------------------------------------------------------------------------------------
      /* TAINT should provide method to generate normalized representation */
      toString() {
        return this.selectors_rpr;
      }

    };
    //---------------------------------------------------------------------------------------------------------
    id_from_cue = function(symbol) {
      return symbol.description;
    };
    //---------------------------------------------------------------------------------------------------------
    selectors_as_list = function(...selectors) {
      if (selectors.length === 0) {
        return [];
      }
      selectors = selectors.flat(2e308);
      if (selectors.length === 0) {
        return [];
      }
      if (selectors.length === 1 && selectors[0] === '') {
        return [''];
      }
      selectors = selectors.join(',');
      selectors = selectors.replace(/\s+/g, '');
      selectors = selectors.split(',');
/* TAINT not generally possible */      return selectors;
    };
    //---------------------------------------------------------------------------------------------------------
    normalize_selectors = function(...selectors) {
      return (_normalize_selectors(...selectors)).selectors;
    };
    //---------------------------------------------------------------------------------------------------------
    _normalize_selectors = function(...selectors) {
      var R, i, len, selector, selectors_rpr;
      selectors = selectors_as_list(...selectors);
      selectors_rpr = selectors.join(', ');
      R = new Set();
      for (i = 0, len = selectors.length; i < len; i++) {
        selector = selectors[i];
        switch (true) {
          case selector === '':
            null;
            break;
          case selector === '*':
            R.add("data#*");
            R.add("cue#*");
            break;
          case selector === '#':
            R.add("cue#*");
            break;
          case /^#.+/.test(selector):
            R.add(`cue${selector}`);
            break;
          case /.+#$/.test(selector):
            R.add(`${selector}*`);
            break;
          case !/#/.test(selector):
            R.add(`${selector}#*`);
            break;
          default:
            R.add(selector);
        }
      }
      if (R.size === 0) {
        R.add('data#*');
      }
      if (R.size !== 1) {
        R.delete('');
      }
      return {
        selectors: R,
        selectors_rpr
      };
    };
    //---------------------------------------------------------------------------------------------------------
    _configure_transform = function(...selectors) {
      var is_sync, original_tfm, ref, selector, tfm, type;
      ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
      selector = new Selector(...selectors);
      original_tfm = tfm;
      //.......................................................................................................
      switch (type = type_of(tfm)) {
        //.....................................................................................................
        case 'sync_jetstream':
          is_sync = true;
          tfm = nameit('(sync_jetstream)', function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            yield* original_tfm.walk(d);
            return null;
          });
          break;
        //.....................................................................................................
        case 'async_jetstream':
          is_sync = false;
          tfm = nameit('(async_jetstream)', async function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            yield* (await original_tfm.walk(d));
            return null;
          });
          break;
        //.....................................................................................................
        case 'function':
          is_sync = true;
          tfm = nameit(`(watcher)_${original_tfm.name}`, function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            original_tfm(d);
            yield d;
            return null;
          });
          break;
        //.....................................................................................................
        case 'asyncfunction':
          is_sync = false;
          tfm = nameit(`(watcher)_${original_tfm.name}`, async function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            await original_tfm(d);
            yield d;
            return null;
          });
          break;
        //.....................................................................................................
        case 'generatorfunction':
          is_sync = true;
          tfm = nameit(`(generator)_${original_tfm.name}`, function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            yield* original_tfm(d);
            return null;
          });
          break;
        //.....................................................................................................
        case 'asyncgeneratorfunction':
          is_sync = false;
          tfm = nameit(`(generator)_${original_tfm.name}`, async function*(d) {
            if (!selector.select(d)) {
              return (yield d);
            }
            yield* (await original_tfm(d));
            return null;
          });
          break;
        default:
          //.....................................................................................................
          throw new Error(`Ωjstrm___3 expected a jetstream or a synchronous function or generator function, got a ${type}`);
      }
      //.......................................................................................................
      return {tfm, original_tfm, type, is_sync};
    };
    Jetstream_abc = (function() {
      //=========================================================================================================
      class Jetstream_abc {
        //-------------------------------------------------------------------------------------------------------
        constructor(cfg) {
          /* TAINT use Object.freeze, push sets new array */
          this.configure(cfg);
          this.transforms = [];
          this.shelf = [];
          return void 0;
        }

        //-------------------------------------------------------------------------------------------------------
        configure(cfg) {
          this.cfg = {...jetstream_cfg_template, ...cfg};
          this.outlet = new Selector(this.cfg.outlet);
          return null;
        }

        //=======================================================================================================
        send(...ds) {
          this.shelf.splice(this.shelf.length, 0, ...ds);
          return null;
        }

        cue(id) {
          this.send(Symbol.for(id));
          return null;
        }

        //=======================================================================================================
        pick_first(...P) {
          return this._pick('first', ...P);
        }

        pick_last(...P) {
          return this._pick('last', ...P);
        }

        pick_all(...P) {
          return this._pick('all', ...P);
        }

        run(...P) {
          return this._pick(this.cfg.pick, ...P);
        }

        //-------------------------------------------------------------------------------------------------------
        _pick_from_list(picker, values) {
          if (picker === 'all') {
            return values;
          }
          if (values.length === 0) {
            if (this.cfg.fallback === misfit) {
              throw new Error("Ωjstrm___6 no results");
            }
            return this.cfg.fallback;
          }
          if (picker === 'first') {
            return values.at(0);
          }
          if (picker === 'last') {
            return values.at(-1);
          }
          throw new Error(`Ωjstrm___7 unknown picker ${picker}`);
        }

        //-------------------------------------------------------------------------------------------------------
        walk(...ds) {
          this.send(...ds);
          return this._walk_and_pick();
        }

      };

      //-------------------------------------------------------------------------------------------------------
      set_getter(Jetstream_abc.prototype, 'length', function() {
        return this.transforms.length;
      });

      set_getter(Jetstream_abc.prototype, 'is_empty', function() {
        return this.transforms.length === 0;
      });

      return Jetstream_abc;

    }).call(this);
    //=========================================================================================================
    Jetstream = class Jetstream extends Jetstream_abc {};
    Async_jetstream = class Async_jetstream extends Jetstream_abc {};
    //=========================================================================================================
    /* NOTE this used to be the idiomatic formulation `R = [ ( @walk P... )..., ]`; for the sake of making
     sync and async versions maximally similar, the sync version has been adapted to the async formulation. My
     first async solution was `R = ( d for await d from genfn P... )`, which doesn't transpilenicely. */
    /* thx to https://allthingssmitty.com/2025/07/14/modern-async-iteration-in-javascript-with-array-fromasync/ */
    Jetstream.prototype._pick = function(picker, ...P) {
      return this._pick_from_list(picker, Array.from(this.walk(...P)));
    };
    Async_jetstream.prototype._pick = async function(picker, ...P) {
      return this._pick_from_list(picker, (await Array.fromAsync(this.walk(...P))));
    };
    //=========================================================================================================
    Jetstream.prototype._walk_and_pick = function*() {
      var count, previous, value;
      previous = misfit;
      count = 0;
//.......................................................................................................
      for (value of this._walk_all_to_exhaustion()) {
        count++;
        if ((count === 1) && (this.cfg.pick === 'first')) {
          yield value;
        } else if (this.cfg.pick === 'all') {
          yield value;
        }
        previous = value;
      }
      if ((this.cfg.pick === 'last') && (count > 0)) {
        //.......................................................................................................
        yield previous;
      }
      return null;
    };
    //---------------------------------------------------------------------------------------------------------
    Async_jetstream.prototype._walk_and_pick = async function*() {
      var count, previous, value;
      previous = misfit;
      count = 0;
//.......................................................................................................
      for await (value of this._walk_all_to_exhaustion()) {
        count++;
        if ((count === 1) && (this.cfg.pick === 'first')) {
          yield value;
        } else if (this.cfg.pick === 'all') {
          yield value;
        }
        previous = value;
      }
      if ((this.cfg.pick === 'last') && (count > 0)) {
        //.......................................................................................................
        yield previous;
      }
      return null;
    };
    //=========================================================================================================
    Jetstream.prototype._walk_all_to_exhaustion = function*() {
      if (this.is_empty) {
        while (this.shelf.length > 0) {
          yield this.shelf.shift();
        }
      } else {
        while (this.shelf.length > 0) {
          yield* this.transforms[0](this.shelf.shift());
        }
      }
      return null;
    };
    //---------------------------------------------------------------------------------------------------------
    Async_jetstream.prototype._walk_all_to_exhaustion = async function*() {
      if (this.is_empty) {
        while (this.shelf.length > 0) {
          yield this.shelf.shift();
        }
      } else {
        while (this.shelf.length > 0) {
          yield* (await this.transforms[0](this.shelf.shift()));
        }
      }
      return null;
    };
    //=========================================================================================================
    Jetstream.prototype.push = function(...selectors) {
      var R, is_sync, my_idx, nxt, ref, tfm, type, yielder;
      ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
      ({tfm, is_sync, type} = _configure_transform(...selectors, tfm));
      if (!is_sync) {
        throw new Error(`Ωjstrm___8 cannot use async transform in sync jetstream, got a ${type}`);
      }
      my_idx = this.transforms.length;
      //.......................................................................................................
      nxt = null;
      yielder = null;
      //.......................................................................................................
      R = nameit(`(managed)_${tfm.name}`, (function(me) {
        return function*(d) {
          if (nxt == null) {
            nxt = me.transforms[my_idx + 1];
            if (nxt != null) {
              yielder = function*(d) {
                var j;
                for (j of tfm(d)) {
                  (yield* nxt(j));
                }
                return null;
              };
            } else {
              yielder = function*(d) {
                var j;
                for (j of tfm(d)) {
                  (me.outlet.select(j) ? (yield j) : void 0);
                }
                return null;
              };
            }
          }
          yield* yielder(d);
          return null;
        };
      })(this));
      //.......................................................................................................
      this.transforms.push(R);
      return R;
    };
    //---------------------------------------------------------------------------------------------------------
    Async_jetstream.prototype.push = function(...selectors) {
      var R, my_idx, nxt, ref, tfm, yielder;
      ref = selectors, [...selectors] = ref, [tfm] = splice.call(selectors, -1);
      ({tfm} = _configure_transform(...selectors, tfm));
      my_idx = this.transforms.length;
      //.......................................................................................................
      nxt = null;
      yielder = null;
      //.......................................................................................................
      R = nameit(`(managed)_${tfm.name}`, (function(me) {
        return async function*(d) {
          if (nxt == null) {
            nxt = me.transforms[my_idx + 1];
            if (nxt != null) {
              yielder = async function*(d) {
                var j;
                for await (j of tfm(d)) {
                  (yield* (await nxt(j)));
                }
                return null;
              };
            } else {
              yielder = async function*(d) {
                var j;
                for await (j of tfm(d)) {
                  (me.outlet.select(j) ? (yield j) : void 0);
                }
                return null;
              };
            }
          }
          yield* (await yielder(d));
          return null;
        };
      })(this));
      //.......................................................................................................
      this.transforms.push(R);
      return R;
    };
    //=========================================================================================================
    internals = Object.freeze({type_of, misfit, jetstream_cfg_template, Selector, _normalize_selectors, normalize_selectors, selectors_as_list, id_from_cue});
    return exports = {Jetstream, Async_jetstream, internals};
  };

  //===========================================================================================================
  Object.assign(module.exports, (() => {
    return {require_jetstream};
  })());

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2pldHN0cmVhbS5icmljcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFBQTtBQUFBLE1BQUEsS0FBQSxFQUFBLGlCQUFBO0lBQUEsa0JBQUE7OztFQUdBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBYyxPQUFkLEVBSEE7Ozs7O0VBU0EsaUJBQUEsR0FBb0IsUUFBQSxDQUFBLENBQUE7QUFDcEIsUUFBQSxlQUFBLEVBQUEsU0FBQSxFQUFBLGFBQUEsRUFBQSxRQUFBLEVBQUEsb0JBQUEsRUFBQSxvQkFBQSxFQUFBLFFBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLFdBQUEsRUFBQSxTQUFBLEVBQUEsc0JBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxVQUFBLEVBQUE7SUFBRSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLENBQUUsT0FBQSxDQUFRLGlCQUFSLENBQUYsQ0FBNkIsQ0FBQyxjQUE5QixDQUFBLENBQTVCO0lBQ0EsQ0FBQTtNQUFFLE9BQUEsRUFBUztJQUFYLENBQUEsR0FBNEIsQ0FBRSxPQUFBLENBQVEsOEJBQVIsQ0FBRixDQUEwQyxDQUFDLGVBQTNDLENBQUEsQ0FBNUI7SUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFVBREYsQ0FBQSxHQUM0QixDQUFFLE9BQUEsQ0FBUSxpQkFBUixDQUFGLENBQTZCLENBQUMsOEJBQTlCLENBQUEsQ0FENUIsRUFGRjs7O0lBT0UsT0FBQSxHQUFVLFFBQUEsQ0FBRSxDQUFGLENBQUE7TUFDUixJQUE4QixDQUFBLFlBQW1CLFNBQWpEO0FBQUEsZUFBUSxpQkFBUjs7TUFDQSxJQUE4QixDQUFBLFlBQWEsZUFBM0M7QUFBQSxlQUFPLGtCQUFQOztBQUNBLGFBQU8sUUFBQSxDQUFTLENBQVQ7SUFIQyxFQVBaOztJQWFFLE1BQUEsR0FBMEIsTUFBQSxDQUFPLFFBQVA7SUFDMUIsc0JB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QUFNLENBQUMsTUFBVixDQUFpQixDQUFqQixDQUFYLEdBQUEsQ0FBQSxNQUFNLENBQU4sQ0FBQSxHQUFBLE1BQUY7Z0JBQUE7dUJBQTJEO2NBQXBFLEVBRHhCO2FBRkY7O1VBS0EsT0FBVyxDQUFBLE1BQU0sT0FBQSxDQUFRLENBQVIsQ0FBTjtpQkFBaUI7UUFOdUI7TUFBZCxDQUFBLEVBQU8sS0FBMUMsRUFOUjs7TUFjSSxJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBaUIsQ0FBakI7QUFDQSxhQUFPO0lBaEJlLEVBM1ExQjs7SUE4UkUsU0FBQSxHQUFZLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FDeEIsT0FEd0IsRUFFeEIsTUFGd0IsRUFHeEIsc0JBSHdCLEVBSXhCLFFBSndCLEVBS3hCLG9CQUx3QixFQU14QixtQkFOd0IsRUFPeEIsaUJBUHdCLEVBUXhCLFdBUndCLENBQWQ7QUFTWixXQUFPLE9BQUEsR0FBVSxDQUFFLFNBQUYsRUFBYSxlQUFiLEVBQThCLFNBQTlCO0VBeFNDLEVBVHBCOzs7RUFzVEEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBaUMsQ0FBQSxDQUFBLENBQUEsR0FBQTtXQUFHLENBQUUsaUJBQUY7RUFBSCxDQUFBLEdBQWpDO0FBdFRBIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCB9ICA9IGNvbnNvbGVcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxucmVxdWlyZV9qZXRzdHJlYW0gPSAtPlxuICB7IG5hbWVpdCwgICAgICAgICAgICAgICB9ID0gKCByZXF1aXJlICcuL3ZhcmlvdXMtYnJpY3MnICkucmVxdWlyZV9uYW1laXQoKVxuICB7IHR5cGVfb2Y6IF90eXBlX29mLCAgICB9ID0gKCByZXF1aXJlICcuL3Vuc3RhYmxlLXJwci10eXBlX29mLWJyaWNzJyApLnJlcXVpcmVfdHlwZV9vZigpXG4gIHsgaGlkZSxcbiAgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9ICggcmVxdWlyZSAnLi92YXJpb3VzLWJyaWNzJyApLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjIyMgVEFJTlQgdXNlIHByb3BlciB0eXBpbmcgIyMjXG4gIHR5cGVfb2YgPSAoIHggKSAtPlxuICAgIHJldHVybiAgJ3N5bmNfamV0c3RyZWFtJyBpZiAoIHggaW5zdGFuY2VvZiAgICAgICBKZXRzdHJlYW0gKVxuICAgIHJldHVybiAnYXN5bmNfamV0c3RyZWFtJyBpZiAoIHggaW5zdGFuY2VvZiBBc3luY19qZXRzdHJlYW0gKVxuICAgIHJldHVybiBfdHlwZV9vZiB4XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBtaXNmaXQgICAgICAgICAgICAgICAgICA9IFN5bWJvbCAnbWlzZml0J1xuICBqZXRzdHJlYW1fY2ZnX3RlbXBsYXRlICA9IHsgb3V0bGV0OiAnZGF0YSMqJywgcGljazogJ2FsbCcsIGZhbGxiYWNrOiBtaXNmaXQsIH1cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGNsYXNzIFNlbGVjdG9yXG4gICAgY29uc3RydWN0b3I6ICggc2VsZWN0b3JzLi4uICkgLT5cbiAgICAgIHsgc2VsZWN0b3JzX3JwcixcbiAgICAgICAgc2VsZWN0b3JzLCAgfSA9IF9ub3JtYWxpemVfc2VsZWN0b3JzIHNlbGVjdG9ycy4uLlxuICAgICAgQHNlbGVjdG9yc19ycHIgID0gc2VsZWN0b3JzX3JwclxuICAgICAgQGRhdGEgICAgICAgICAgID0gaWYgc2VsZWN0b3JzLnNpemUgaXMgMCB0aGVuIHRydWUgZWxzZSBmYWxzZVxuICAgICAgQGN1ZXMgICAgICAgICAgID0gZmFsc2VcbiAgICAgIGZvciBzZWxlY3RvciBmcm9tIHNlbGVjdG9yc1xuICAgICAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJ2RhdGEjKicgdGhlbiBAZGF0YSA9IHRydWVcbiAgICAgICAgICB3aGVuIHNlbGVjdG9yIGlzICdjdWUjKicgdGhlbiBAY3VlcyA9IHRydWVcbiAgICAgICAgICB3aGVuICggbWF0Y2ggPSBzZWxlY3Rvci5tYXRjaCAvXmRhdGEjKD88aWQ+LispJC8gKT9cbiAgICAgICAgICAgICMjIyBUQUlOVCBtZW50aW9uIG9yaWdpbmFsIHNlbGVjdG9yIG5leHQgdG8gbm9ybWFsaXplZCBmb3JtICMjI1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzEgSURzIG9uIGRhdGEgaXRlbXMgbm90IHN1cHBvcnRlZCwgZ290ICN7c2VsZWN0b3J9XCJcbiAgICAgICAgICB3aGVuICggbWF0Y2ggPSBzZWxlY3Rvci5tYXRjaCAvXmN1ZSMoPzxpZD4uKykkLyApP1xuICAgICAgICAgICAgQGN1ZXMgPSBuZXcgU2V0KCkgaWYgQGN1ZXMgaW4gWyB0cnVlLCBmYWxzZSwgXVxuICAgICAgICAgICAgQGN1ZXMuYWRkIG1hdGNoLmdyb3Vwcy5pZFxuICAgICAgICAgIGVsc2UgbnVsbFxuICAgICAgQGFjY2VwdF9hbGwgICAgID0gKCBAZGF0YSBpcyB0cnVlICkgYW5kICggQGN1ZXMgaXMgdHJ1ZSApXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9nZXRfZXhjZXJwdDogLT4geyBkYXRhOiBAZGF0YSwgY3VlczogQGN1ZXMsIGFjY2VwdF9hbGw6IEBhY2NlcHRfYWxsLCB9XG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNlbGVjdDogKCBpdGVtICkgLT5cbiAgICAgIHJldHVybiB0cnVlIGlmIEBhY2NlcHRfYWxsXG4gICAgICBpZiBpc19jdWUgPSAoIHR5cGVvZiBpdGVtICkgaXMgJ3N5bWJvbCdcbiAgICAgICAgcmV0dXJuIHRydWUgICBpZiBAY3VlcyBpcyB0cnVlXG4gICAgICAgIHJldHVybiBmYWxzZSAgaWYgQGN1ZXMgaXMgZmFsc2VcbiAgICAgICAgcmV0dXJuIEBjdWVzLmhhcyBpZF9mcm9tX2N1ZSBpdGVtXG4gICAgICByZXR1cm4gdHJ1ZSAgIGlmIEBkYXRhIGlzIHRydWVcbiAgICAgIHJldHVybiBmYWxzZSAgaWYgQGRhdGEgaXMgZmFsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX18yIElEcyBvbiBkYXRhIGl0ZW1zIG5vdCBzdXBwb3J0ZWQgaW4gc2VsZWN0b3IgI3tycHIgQHRvU3RyaW5nfVwiXG4gICAgICAjIHJldHVybiBAZGF0YS5oYXMgaWRfZnJvbV92YWx1ZSBpdGVtXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICMjIyBUQUlOVCBzaG91bGQgcHJvdmlkZSBtZXRob2QgdG8gZ2VuZXJhdGUgbm9ybWFsaXplZCByZXByZXNlbnRhdGlvbiAjIyNcbiAgICB0b1N0cmluZzogLT4gQHNlbGVjdG9yc19ycHJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlkX2Zyb21fY3VlID0gKCBzeW1ib2wgKSAtPiBzeW1ib2wuZGVzY3JpcHRpb25cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNlbGVjdG9yc19hc19saXN0ID0gKCBzZWxlY3RvcnMuLi4gKSAtPlxuICAgIHJldHVybiBbXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDBcbiAgICBzZWxlY3RvcnMgPSBzZWxlY3RvcnMuZmxhdCBJbmZpbml0eVxuICAgIHJldHVybiBbXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDBcbiAgICByZXR1cm4gWyAnJywgXSBpZiBzZWxlY3RvcnMubGVuZ3RoIGlzIDEgYW5kIHNlbGVjdG9yc1sgMCBdIGlzICcnXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLmpvaW4gJywnXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLnJlcGxhY2UgL1xccysvZywgJycgIyMjIFRBSU5UIG5vdCBnZW5lcmFsbHkgcG9zc2libGUgIyMjXG4gICAgc2VsZWN0b3JzID0gc2VsZWN0b3JzLnNwbGl0ICcsJyAjIyMgVEFJTlQgbm90IGdlbmVyYWxseSBwb3NzaWJsZSAjIyNcbiAgICByZXR1cm4gc2VsZWN0b3JzXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBub3JtYWxpemVfc2VsZWN0b3JzID0gKCBzZWxlY3RvcnMuLi4gKSAtPiAoIF9ub3JtYWxpemVfc2VsZWN0b3JzIHNlbGVjdG9ycy4uLiApLnNlbGVjdG9yc1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX25vcm1hbGl6ZV9zZWxlY3RvcnMgPSAoIHNlbGVjdG9ycy4uLiApIC0+XG4gICAgc2VsZWN0b3JzICAgICA9IHNlbGVjdG9yc19hc19saXN0IHNlbGVjdG9ycy4uLlxuICAgIHNlbGVjdG9yc19ycHIgPSBzZWxlY3RvcnMuam9pbiAnLCAnXG4gICAgUiAgICAgICAgICAgICA9IG5ldyBTZXQoKVxuICAgIGZvciBzZWxlY3RvciBpbiBzZWxlY3RvcnNcbiAgICAgIHN3aXRjaCB0cnVlXG4gICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJycgICAgICAgICAgICAgdGhlbiBudWxsXG4gICAgICAgIHdoZW4gc2VsZWN0b3IgaXMgJyonICAgICAgICAgICAgdGhlbiBSLmFkZCBcImRhdGEjKlwiOyBSLmFkZCBcImN1ZSMqXCJcbiAgICAgICAgd2hlbiBzZWxlY3RvciBpcyAnIycgICAgICAgICAgICB0aGVuIFIuYWRkIFwiY3VlIypcIlxuICAgICAgICB3aGVuIC9eIy4rLy50ZXN0IHNlbGVjdG9yICAgICAgIHRoZW4gUi5hZGQgXCJjdWUje3NlbGVjdG9yfVwiXG4gICAgICAgIHdoZW4gLy4rIyQvLnRlc3Qgc2VsZWN0b3IgICAgICAgdGhlbiBSLmFkZCBcIiN7c2VsZWN0b3J9KlwiXG4gICAgICAgIHdoZW4gbm90IC8jLy50ZXN0IHNlbGVjdG9yICAgICAgdGhlbiBSLmFkZCBcIiN7c2VsZWN0b3J9IypcIlxuICAgICAgICBlbHNlIFIuYWRkIHNlbGVjdG9yXG4gICAgUi5hZGQgJ2RhdGEjKicgaWYgUi5zaXplIGlzIDBcbiAgICBSLmRlbGV0ZSAnJyBpZiBSLnNpemUgaXNudCAxXG4gICAgcmV0dXJuIHsgc2VsZWN0b3JzOiBSLCBzZWxlY3RvcnNfcnByLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfY29uZmlndXJlX3RyYW5zZm9ybSA9ICggc2VsZWN0b3JzLi4uLCB0Zm0gKSAtPlxuICAgIHNlbGVjdG9yICAgICAgPSBuZXcgU2VsZWN0b3Igc2VsZWN0b3JzLi4uXG4gICAgb3JpZ2luYWxfdGZtICA9IHRmbVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc3dpdGNoIHR5cGUgPSB0eXBlX29mIHRmbVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuICdzeW5jX2pldHN0cmVhbSdcbiAgICAgICAgaXNfc3luYyA9IHRydWVcbiAgICAgICAgdGZtICAgICA9IG5hbWVpdCAnKHN5bmNfamV0c3RyZWFtKScsICggZCApIC0+XG4gICAgICAgICAgcmV0dXJuIHlpZWxkIGQgdW5sZXNzIHNlbGVjdG9yLnNlbGVjdCBkXG4gICAgICAgICAgeWllbGQgZnJvbSBvcmlnaW5hbF90Zm0ud2FsayBkIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gJ2FzeW5jX2pldHN0cmVhbSdcbiAgICAgICAgaXNfc3luYyA9IGZhbHNlXG4gICAgICAgIHRmbSAgICAgPSBuYW1laXQgJyhhc3luY19qZXRzdHJlYW0pJywgKCBkICkgLT5cbiAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICB5aWVsZCBmcm9tIGF3YWl0IG9yaWdpbmFsX3RmbS53YWxrIGQgO251bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgd2hlbiAnZnVuY3Rpb24nXG4gICAgICAgIGlzX3N5bmMgPSB0cnVlXG4gICAgICAgIHRmbSAgICAgPSBuYW1laXQgXCIod2F0Y2hlcilfI3tvcmlnaW5hbF90Zm0ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICBvcmlnaW5hbF90Zm0gZDsgeWllbGQgZCA7bnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB3aGVuICdhc3luY2Z1bmN0aW9uJ1xuICAgICAgICBpc19zeW5jID0gZmFsc2VcbiAgICAgICAgdGZtICAgICA9IG5hbWVpdCBcIih3YXRjaGVyKV8je29yaWdpbmFsX3RmbS5uYW1lfVwiLCAoIGQgKSAtPlxuICAgICAgICAgIHJldHVybiB5aWVsZCBkIHVubGVzcyBzZWxlY3Rvci5zZWxlY3QgZFxuICAgICAgICAgIGF3YWl0IG9yaWdpbmFsX3RmbSBkOyB5aWVsZCBkIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gJ2dlbmVyYXRvcmZ1bmN0aW9uJ1xuICAgICAgICBpc19zeW5jID0gdHJ1ZVxuICAgICAgICB0Zm0gICAgID0gbmFtZWl0IFwiKGdlbmVyYXRvcilfI3tvcmlnaW5hbF90Zm0ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICB5aWVsZCBmcm9tIG9yaWdpbmFsX3RmbSBkIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHdoZW4gJ2FzeW5jZ2VuZXJhdG9yZnVuY3Rpb24nXG4gICAgICAgIGlzX3N5bmMgPSBmYWxzZVxuICAgICAgICB0Zm0gICAgID0gbmFtZWl0IFwiKGdlbmVyYXRvcilfI3tvcmlnaW5hbF90Zm0ubmFtZX1cIiwgKCBkICkgLT5cbiAgICAgICAgICByZXR1cm4geWllbGQgZCB1bmxlc3Mgc2VsZWN0b3Iuc2VsZWN0IGRcbiAgICAgICAgICB5aWVsZCBmcm9tIGF3YWl0IG9yaWdpbmFsX3RmbSBkIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzMgZXhwZWN0ZWQgYSBqZXRzdHJlYW0gb3IgYSBzeW5jaHJvbm91cyBmdW5jdGlvbiBvciBnZW5lcmF0b3IgZnVuY3Rpb24sIGdvdCBhICN7dHlwZX1cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIHsgdGZtLCBvcmlnaW5hbF90Zm0sIHR5cGUsIGlzX3N5bmMsIH1cblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgY2xhc3MgSmV0c3RyZWFtX2FiY1xuXG4gICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgICAgIyMjIFRBSU5UIHVzZSBPYmplY3QuZnJlZXplLCBwdXNoIHNldHMgbmV3IGFycmF5ICMjI1xuICAgICAgQGNvbmZpZ3VyZSBjZmdcbiAgICAgIEB0cmFuc2Zvcm1zID0gW11cbiAgICAgIEBzaGVsZiAgICAgID0gW11cbiAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uZmlndXJlOiAoIGNmZyApIC0+XG4gICAgICBAY2ZnICAgID0geyBqZXRzdHJlYW1fY2ZnX3RlbXBsYXRlLi4uLCBjZmcuLi4sIH1cbiAgICAgIEBvdXRsZXQgPSBuZXcgU2VsZWN0b3IgQGNmZy5vdXRsZXRcbiAgICAgIDtudWxsXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHNldF9nZXR0ZXIgQDo6LCAnbGVuZ3RoJywgICAtPiBAdHJhbnNmb3Jtcy5sZW5ndGhcbiAgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX2VtcHR5JywgLT4gQHRyYW5zZm9ybXMubGVuZ3RoIGlzIDBcblxuICAgICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgc2VuZDogKCBkcy4uLiApIC0+IEBzaGVsZi5zcGxpY2UgQHNoZWxmLmxlbmd0aCwgMCwgZHMuLi4gIDtudWxsXG4gICAgY3VlOiAgKCBpZCAgICApIC0+IEBzZW5kIFN5bWJvbC5mb3IgaWQgICAgICAgICAgICAgICAgICAgIDtudWxsXG5cbiAgICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHBpY2tfZmlyc3Q6ICggUC4uLiApIC0+IEBfcGljayAnZmlyc3QnLCAgIFAuLi5cbiAgICBwaWNrX2xhc3Q6ICAoIFAuLi4gKSAtPiBAX3BpY2sgJ2xhc3QnLCAgICBQLi4uXG4gICAgcGlja19hbGw6ICAgKCBQLi4uICkgLT4gQF9waWNrICdhbGwnLCAgICAgUC4uLlxuICAgIHJ1bjogICAgICAgICggUC4uLiApIC0+IEBfcGljayBAY2ZnLnBpY2ssIFAuLi5cblxuICAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3BpY2tfZnJvbV9saXN0OiAoIHBpY2tlciwgdmFsdWVzICkgLT5cbiAgICAgIHJldHVybiB2YWx1ZXMgaWYgcGlja2VyIGlzICdhbGwnXG4gICAgICBpZiB2YWx1ZXMubGVuZ3RoIGlzIDBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlqc3RybV9fXzYgbm8gcmVzdWx0c1wiIGlmIEBjZmcuZmFsbGJhY2sgaXMgbWlzZml0XG4gICAgICAgIHJldHVybiBAY2ZnLmZhbGxiYWNrXG4gICAgICByZXR1cm4gdmFsdWVzLmF0ICAwIGlmIHBpY2tlciBpcyAnZmlyc3QnXG4gICAgICByZXR1cm4gdmFsdWVzLmF0IC0xIGlmIHBpY2tlciBpcyAnbGFzdCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX183IHVua25vd24gcGlja2VyICN7cGlja2VyfVwiXG5cbiAgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHdhbGs6ICggZHMuLi4gKSAtPlxuICAgICAgQHNlbmQgZHMuLi5cbiAgICAgIHJldHVybiBAX3dhbGtfYW5kX3BpY2soKVxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBjbGFzcyBKZXRzdHJlYW0gICAgICAgZXh0ZW5kcyBKZXRzdHJlYW1fYWJjXG4gIGNsYXNzIEFzeW5jX2pldHN0cmVhbSBleHRlbmRzIEpldHN0cmVhbV9hYmNcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICMjIyBOT1RFIHRoaXMgdXNlZCB0byBiZSB0aGUgaWRpb21hdGljIGZvcm11bGF0aW9uIGBSID0gWyAoIEB3YWxrIFAuLi4gKS4uLiwgXWA7IGZvciB0aGUgc2FrZSBvZiBtYWtpbmdcbiAgc3luYyBhbmQgYXN5bmMgdmVyc2lvbnMgbWF4aW1hbGx5IHNpbWlsYXIsIHRoZSBzeW5jIHZlcnNpb24gaGFzIGJlZW4gYWRhcHRlZCB0byB0aGUgYXN5bmMgZm9ybXVsYXRpb24uIE15XG4gIGZpcnN0IGFzeW5jIHNvbHV0aW9uIHdhcyBgUiA9ICggZCBmb3IgYXdhaXQgZCBmcm9tIGdlbmZuIFAuLi4gKWAsIHdoaWNoIGRvZXNuJ3QgdHJhbnNwaWxlbmljZWx5LiAjIyNcbiAgIyMjIHRoeCB0byBodHRwczovL2FsbHRoaW5nc3NtaXR0eS5jb20vMjAyNS8wNy8xNC9tb2Rlcm4tYXN5bmMtaXRlcmF0aW9uLWluLWphdmFzY3JpcHQtd2l0aC1hcnJheS1mcm9tYXN5bmMvICMjI1xuICBKZXRzdHJlYW06Ol9waWNrICAgICAgID0gKCBwaWNrZXIsIFAuLi4gKSAtPiBAX3BpY2tfZnJvbV9saXN0IHBpY2tlciwgICAgICAgQXJyYXkuZnJvbSAgICAgIEB3YWxrIFAuLi5cbiAgQXN5bmNfamV0c3RyZWFtOjpfcGljayA9ICggcGlja2VyLCBQLi4uICkgLT4gQF9waWNrX2Zyb21fbGlzdCBwaWNrZXIsIGF3YWl0IEFycmF5LmZyb21Bc3luYyBAd2FsayBQLi4uXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBKZXRzdHJlYW06Ol93YWxrX2FuZF9waWNrID0gLT5cbiAgICBwcmV2aW91cyAgPSBtaXNmaXRcbiAgICBjb3VudCAgICAgPSAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgdmFsdWUgZnJvbSBAX3dhbGtfYWxsX3RvX2V4aGF1c3Rpb24oKVxuICAgICAgY291bnQrK1xuICAgICAgaWYgKCBjb3VudCBpcyAxICkgYW5kICggQGNmZy5waWNrIGlzICdmaXJzdCcgKVxuICAgICAgICB5aWVsZCB2YWx1ZVxuICAgICAgZWxzZSBpZiBAY2ZnLnBpY2sgaXMgJ2FsbCdcbiAgICAgICAgeWllbGQgdmFsdWVcbiAgICAgIHByZXZpb3VzID0gdmFsdWVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHlpZWxkIHByZXZpb3VzIGlmICggQGNmZy5waWNrIGlzICdsYXN0JyApIGFuZCAoIGNvdW50ID4gMCApXG4gICAgO251bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEFzeW5jX2pldHN0cmVhbTo6X3dhbGtfYW5kX3BpY2sgPSAtPlxuICAgIHByZXZpb3VzICA9IG1pc2ZpdFxuICAgIGNvdW50ICAgICA9IDBcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZvciBhd2FpdCB2YWx1ZSBmcm9tIEBfd2Fsa19hbGxfdG9fZXhoYXVzdGlvbigpXG4gICAgICBjb3VudCsrXG4gICAgICBpZiAoIGNvdW50IGlzIDEgKSBhbmQgKCBAY2ZnLnBpY2sgaXMgJ2ZpcnN0JyApXG4gICAgICAgIHlpZWxkIHZhbHVlXG4gICAgICBlbHNlIGlmIEBjZmcucGljayBpcyAnYWxsJ1xuICAgICAgICB5aWVsZCB2YWx1ZVxuICAgICAgcHJldmlvdXMgPSB2YWx1ZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgeWllbGQgcHJldmlvdXMgaWYgKCBAY2ZnLnBpY2sgaXMgJ2xhc3QnICkgYW5kICggY291bnQgPiAwIClcbiAgICA7bnVsbFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgSmV0c3RyZWFtOjpfd2Fsa19hbGxfdG9fZXhoYXVzdGlvbiA9IC0+XG4gICAgaWYgQGlzX2VtcHR5ICB0aGVuICB5aWVsZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNoZWxmLnNoaWZ0KCkgd2hpbGUgQHNoZWxmLmxlbmd0aCA+IDBcbiAgICBlbHNlICAgICAgICAgICAgICAgIHlpZWxkIGZyb20gICAgICAgQHRyYW5zZm9ybXNbIDAgXSBAc2hlbGYuc2hpZnQoKSB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICAgIDtudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBBc3luY19qZXRzdHJlYW06Ol93YWxrX2FsbF90b19leGhhdXN0aW9uID0gLT5cbiAgICBpZiBAaXNfZW1wdHkgIHRoZW4gIHlpZWxkICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAc2hlbGYuc2hpZnQoKSB3aGlsZSBAc2hlbGYubGVuZ3RoID4gMFxuICAgIGVsc2UgICAgICAgICAgICAgICAgeWllbGQgZnJvbSBhd2FpdCBAdHJhbnNmb3Jtc1sgMCBdIEBzaGVsZi5zaGlmdCgpIHdoaWxlIEBzaGVsZi5sZW5ndGggPiAwXG4gICAgO251bGxcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEpldHN0cmVhbTo6cHVzaCA9ICggc2VsZWN0b3JzLi4uLCB0Zm0gKSAtPlxuICAgIHsgdGZtLFxuICAgICAgaXNfc3luYyxcbiAgICAgIHR5cGUsICAgfSA9IF9jb25maWd1cmVfdHJhbnNmb3JtIHNlbGVjdG9ycy4uLiwgdGZtXG4gICAgdW5sZXNzIGlzX3N5bmNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6panN0cm1fX184IGNhbm5vdCB1c2UgYXN5bmMgdHJhbnNmb3JtIGluIHN5bmMgamV0c3RyZWFtLCBnb3QgYSAje3R5cGV9XCJcbiAgICBteV9pZHggICAgICA9IEB0cmFuc2Zvcm1zLmxlbmd0aFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgbnh0ICAgICAgICAgPSBudWxsXG4gICAgeWllbGRlciAgICAgPSBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSID0gbmFtZWl0IFwiKG1hbmFnZWQpXyN7dGZtLm5hbWV9XCIsIGRvICggbWUgPSBAICkgLT4gKCBkICkgLT5cbiAgICAgIHVubGVzcyBueHQ/XG4gICAgICAgIG54dCA9IG1lLnRyYW5zZm9ybXNbIG15X2lkeCArIDEgXVxuICAgICAgICBpZiBueHQ/IHRoZW4gIHlpZWxkZXIgPSAoIGQgKSAtPiAoIHlpZWxkIGZyb20gICAgICAgbnh0IGogICAgICAgICApIGZvciAgICAgICBqIGZyb20gdGZtIGQgO251bGxcbiAgICAgICAgZWxzZSAgICAgICAgICB5aWVsZGVyID0gKCBkICkgLT4gKCB5aWVsZCBqIGlmIG1lLm91dGxldC5zZWxlY3QgaiAgKSBmb3IgICAgICAgaiBmcm9tIHRmbSBkIDtudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHlpZWxkIGZyb20geWllbGRlciBkIDtudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAdHJhbnNmb3Jtcy5wdXNoIFJcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQXN5bmNfamV0c3RyZWFtOjpwdXNoID0gKCBzZWxlY3RvcnMuLi4sIHRmbSApIC0+XG4gICAgeyB0Zm0sICAgIH0gPSBfY29uZmlndXJlX3RyYW5zZm9ybSBzZWxlY3RvcnMuLi4sIHRmbVxuICAgIG15X2lkeCAgICAgID0gQHRyYW5zZm9ybXMubGVuZ3RoXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBueHQgICAgICAgICA9IG51bGxcbiAgICB5aWVsZGVyICAgICA9IG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgPSBuYW1laXQgXCIobWFuYWdlZClfI3t0Zm0ubmFtZX1cIiwgZG8gKCBtZSA9IEAgKSAtPiAoIGQgKSAtPlxuICAgICAgdW5sZXNzIG54dD9cbiAgICAgICAgbnh0ID0gbWUudHJhbnNmb3Jtc1sgbXlfaWR4ICsgMSBdXG4gICAgICAgIGlmIG54dD8gdGhlbiAgeWllbGRlciA9ICggZCApIC0+ICggeWllbGQgZnJvbSBhd2FpdCBueHQgaiAgICAgICAgICkgZm9yIGF3YWl0IGogZnJvbSB0Zm0gZCA7bnVsbFxuICAgICAgICBlbHNlICAgICAgICAgIHlpZWxkZXIgPSAoIGQgKSAtPiAoIHlpZWxkIGogaWYgbWUub3V0bGV0LnNlbGVjdCBqICApIGZvciBhd2FpdCBqIGZyb20gdGZtIGQgO251bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgeWllbGQgZnJvbSBhd2FpdCB5aWVsZGVyIGQgO251bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIEB0cmFuc2Zvcm1zLnB1c2ggUlxuICAgIHJldHVybiBSXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBpbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHtcbiAgICB0eXBlX29mLFxuICAgIG1pc2ZpdCxcbiAgICBqZXRzdHJlYW1fY2ZnX3RlbXBsYXRlLFxuICAgIFNlbGVjdG9yLFxuICAgIF9ub3JtYWxpemVfc2VsZWN0b3JzLFxuICAgIG5vcm1hbGl6ZV9zZWxlY3RvcnMsXG4gICAgc2VsZWN0b3JzX2FzX2xpc3QsXG4gICAgaWRfZnJvbV9jdWUsIH1cbiAgcmV0dXJuIGV4cG9ydHMgPSB7IEpldHN0cmVhbSwgQXN5bmNfamV0c3RyZWFtLCBpbnRlcm5hbHMsIH1cblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywgZG8gPT4geyByZXF1aXJlX2pldHN0cmVhbSwgfVxuIl19
