<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Bric-A-Brac Standard Brics](#bric-a-brac-standard-brics)
  - [To Do](#to-do)
    - [JetStream](#jetstream)
      - [JetStream: Instantiation, Configuration, Building](#jetstream-instantiation-configuration-building)
      - [JetStream: Adding Data](#jetstream-adding-data)
      - [JetStream: Running and Retrieving Results](#jetstream-running-and-retrieving-results)
      - [JetStream: Note on Picking Values](#jetstream-note-on-picking-values)
      - [JetStream: Selectors](#jetstream-selectors)
      - [See Also](#see-also)
    - [Loupe, Show](#loupe-show)
    - [Random](#random)
      - [Random: Implementation Structure](#random-implementation-structure)
        - [References](#references)
        - [To Do](#to-do-1)
    - [Benchmark](#benchmark)
    - [Errors](#errors)
    - [Remap](#remap)
    - [Other](#other)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# Bric-A-Brac Standard Brics


## To Do

### JetStream

* JetStream is a utlity to construct data processing pipelines from series of data transform.
* Each transform is a generator function that accepts one data item and yields any number of transformed
  data items.
* Because of this setup, each transform can choose to ignore a data item, or to swallow it, or to produce
  many new data items in response.
* This makes JetStream much more flexible and useful than approaches that depend on non-generator functions.
  You can still build useful stuff with those but they're inherently incapable to, say, turn a (stream of)
  string(s) into a stream of characters.
* Currently JetStream currently only uses synchronous transforms.
* Actually more of a bucket chain than a garden hose for what it's worth.
* Can 'configure' transforms to receive only some, not all data items; can re-use the same transform in
  multiple configurations in a single pipeline.
* Default is for a transform to receive all data items but no cues.
* Whatever the last transform in the pipeline `yield`s becomes part of the pipeline's output, except that it
  will be implicitly filtered by a conceptual 'outlet' transform. The default for the outlet is the same as
  that for any transform (i.e. all data items, no cues); this can be changed bei configuring the pipeline:
  * at instantiation time: `jet = new Jetstream { outlet: 'data,#stop', }`
  * dynamically: `jet.configure { outlet: 'data,#stop', }`

#### JetStream: Instantiation, Configuration, Building

* **`Jetstream::constructor: ( cfg ) ->`**—

* **`Jetstream::configure: ( cfg ) ->`**—dynamically set properties to determine pipeline characteristics.
  `cfg` should be an object with the following optional keys:
  * **`outlet`**—a [JetStream selector](#jetstream-selectors) that determines the filtering to be applied
    after the last transform for a given item has finished and before that value is made available in the
    output. Default is `'data'`, meaning all data items but no cues will be considered for output.
  * **`pick`**—after result items have been filtered as determined by the `outlet` setting, apply a sieve to
    the stream or list of results. Default is `{ pick: 'all', }`, meaning 'return all results' (as an
    iterator for `walk()`, as a list for `run()`). `'first'` will pick the first, `'last'` the last element
    (of the stream or list); observe that in these cases, `walk()` will still be an iterator (over zero or
    one values), but `run()` will return only the first or last values instead of a possibly empty list. If
    there are no results, calling `run()` will cause an error unless a `fallback` has been explicitly set.
  * **`fallback`**—determine a return value for `run()` to be used in case no other values were produced by
    the pipeline.
  * **Observe** that no matter whether or not you use `pick: 'all'`, `pick: 'first'`, or `pick: 'last'`—when
    you call `Jetstream::run()`, all transforms will be called the same number of times with the same
    values. The same is true when you use `Jetstream::walk()` and make sure the generator runs to
    completion.

* **`Jetstream::push: ( P..., t ) ->`**—add a transform `t` to the pipeline. `t` can be a generator function
  or a non-generator function; in the latter case the transform is called a 'watcher' as it can only observe
  items. If `t` is preceded by one or several arguments, those arguments will be interpreted as
  configurations of `t`. So far [selectors](#jetstream-selectors) are the only implemented configuration
  option.

#### JetStream: Adding Data

* **`Jetstream::send: ( ds... ) ->`**—'shelve' zero or more items in the pipeline; processing will start
  when `Jetstream::walk()` is called.

* **`Jetstream::cue: ( ids ) ->`**—create a public Symbol from `id` and `Jetstream::send()` it. Convenience
  method equivalent to `Jetstream::send Symbol.from id`

#### JetStream: Running and Retrieving Results

* **`Jetstream::walk: ( ds... ) ->`**—'shelve' zero or more items in the pipeline and return an iterator
  over the processed results. Calling `Jetstream::walk d1, d2, ...` is equivalent to calling
  `Jetstream::send d1, d2, ...` followed by `Jetstream::walk()`. When the iterator stops, the pipeline has
  been exhausted (no more shelved items); further processing will only occur when at least one item has been
  sent and `Jetstream::walk()` has been called.

* **`Jetstream::run: ( ds... ) ->`**—same as calling `Jetstream::walk()` with the same arguments, but will
  return either a list containing all results or—depending on
  [configuration](#jetstream-instantiation-configuration-building)—a single result.

* **`Jetstream::pick_first: ( ds... ) ->`**—same as calling `[ ( Jetstream::walk()... )..., ]` with the same
  arguments, and either picking the first value in the list, or, if it's empty, use the configured
  `fallback` value, or else throw an error. Observe that for a pipeline that is configured to always `pick`
  the first or last value, using `Jetstream::pick_first()` will behave just like `Jetstream::run()`.

* **`Jetstream::pick_last: ( ds... ) ->`**—same as calling `[ ( Jetstream::walk()... )..., ]` with the same
  arguments, and either picking the last value in the list, or, if it's empty, use the configured `fallback`
  value, or else throw an error. Observe that for a pipeline that is configured to always `pick` the first
  or last value, using `Jetstream::pick_last()` will behave just like `Jetstream::run()`.

#### JetStream: Note on Picking Values

The result of a JetStream run is always a (possibly empty) list of values, unless either the stream has been
configured to pick the last or the first value, or `Jetstream::pick_first()` or `Jetstream::pick_last()` have
been called. The semantics of picking or getting singular values have been intentionally designed so that
the least possible change is made with regard to calling of transforms and handling of intermediate values.
This also means that if your pipeline computes a million values of which you only need the first value which
doesn't depend on any other value in the result list, then `{ pick: 'first', }` is probably not the right
tool to do that because in order to get that single value, each transform will still be called a million
times. One should rather look for a cutoff point in the input early on and terminate processing as soon as
possible rather than burdening the pipeline with throwaway values.

#### JetStream: Selectors

**to be rewritten**

<!--
* cue < Q (see Shakespeare)
* pip
* blip (as in, a blip in the data)
* vee (for V as in value)
* dee (for D as in data)
 -->


* **`[—]`** When instantiating a pipeline (`new Jetstream()`), should be possible to register cues?
  Registered cues would then only be sent into transforms that are configured to listen to them (ex. `$ {
  first, }, ( d ) -> ...`). Signals can be sent by tranforms or the `Jetstream` API.
  * **`[—]`** problem with that: composing pipelines. Transforms rely on testing for `d is whatever_cue`
    which fails when a sub-pipeline has been built with a different private symbol
  * **`[—]`** maybe treat all symbols specially? Could match an `s1 = Symbol 'A'`, `s2 = Symbol 'A'` by
    demanding configuration of `$ { A, }, ( d ) -> ...` matching the string value of symbols
  * **`[—]`** 'Signals' are meta-data as opposed to 'common'/'business data'. As such cues should, in
    general, only be sent into those transforms that are built to digest them; ex. when you have a transform
    `( d ) -> d ** 2`, that transform will fail when anything but a number is sent into it. That's a Good
    Thing if the business data itself contained something else but numbers (now you know your pipeline was
    incorrectly constructed), but a Bad Thing if this happens because now the transform was called with a
    cue it didn't ask for and isn't prepared to deal with.
  * **`[—]`** hold open the possiblity to send arbitrary structured data as cues (meta data), not only
    `Symbol`s
  * **`[—]`** *The Past*: The way we've been dealing with cues is we had a few known ones like `first`,
    `before_last`, `last`, and so on; the user would declare them with the `$` (transform configurator)
    method, using values of their own choosing. Most of the time cue values are declared in the
    application as appropriately named private symbols such as right before usage `first = Symbol 'first'`,
    then the transform gets declared and added as `$ { first, }, t = ( d ) -> ...`, finally, in the
    transform, a check `d is first` is used to sort out meta data from business data. This all hinges on the
    name (`first`) being known to the pipeline object (`Jetstream` instance) knowing the *names* (`first`,
    `before_last` and so on) and their *semantics* (so names are a controlled vocabulary), and the transform
    knowing their *identity* (because you can't check for a specific private symbol if you don't hold that
    symbol). In essence we're using the same data parameter `d` to transport both business data and meta
    data.
  * **`[—]`** *The Future*:
    * Meta data has distinct types: private symbols, public symbols, instances of class `Signal`.
    * Each piece of meta data has a name; for symbols `s`, that's `( String s )[ 7 ... ( String s ).length -
      1 ]`.
    * Meta data only sent to transforms that are explicitly configured to handle them.
    * Generic configuration could use `$ { select, }, ( d ) -> ...` where `select` is a boolean or a boolen
      function.
    * The default is `select: ( d ) -> not @is_cue d` (or `select: 'data'`), i.e. 'deselect all cues'.
      `select: -> true` (or indeed `select: true`) means 'send all business and meta data'. `select: false`
      indicates 'transform not used'. `select: 'cues'` means 'send all cues but no data'.
    * `### TAINT` unify usage of 'meta', 'cue'
    * Un`select`ed data that is not sent into the transform is to be sent on to the next transform.
    * The custom `select()` function will be called in a context that provides convenience methods.
    * As a shortcut, a descriptive string may be used to configure selection:
      * format similar to CSS selectors
      * `'data'`: select all business data, no cues (the default)
      * `'cue'`: select all cues, no data
      * `'cue, data'`: select all data and all cues (same as `select: ( -> true )`)

    * Another approach:
      * `Jetstream::push()` defined as `( selectors..., transform ) -> ...`
      * `selectors` can be one or more single and arrays of selectors
      * will be flattened, meaning `Jetstream::push s1, [ s2, [ s3, ], ], s4, t` means the same as
        `Jetstream::push s1, s2, s3, s4, t`
      * at first we don't support concatenation of selectors, only series of disjunct selectors
      * concatenated selectors will likely have to default to logical conjunction ('and')
      * as such concatening selectors with `,` (comma) will likely be used to indicate disjunction ('or'),
        as in CSS
      * transform gets to see item when (at least) one selector matches
        * a missing selector expands to the `data` selector. By default, transforms get to see only data items, no cues, which
          is the right thing to do in most cases.
        * an empty selector selects nothing, so the transform gets skipped. As is true for transforms that
          do not accept everything, unselected items are sent to the successor of the current transform.
        * `data` matches business data items (implicitly present)
        * `cue`, `cue` matches cues (opt-in); equivalent to `:not(data)`
        * `cue#first` matches cues with ID (name) `first`
        * `cue#last` matches cues with ID (name) `last`
        * `cue#first,cue#last` ( or `[ 'cue#first', 'cue#last', ]` ) matches cues with IDs `first` or `last`
        * `#first', '#last` same, ID selectors implicitly refer to `cue`, therefore `#first` equals
          `cue#first`
        * `*`, `data,cue`, `data#*,cue#*` are alternatives to mean 'all data items and all cues'
        * `:not(data)` prevents business data items from being sent (opt-out); since all items are
          classified as either `data` or `cue`, it implicitly selects all cues
        * `:not(cue)` prevents cues from being sent (implicitly present), implicitly selects all `data`
          items
      * Jetstream data items are conceptualized as HTML elements

        ```
        "abc"               -> <data type=text value='abc'/>
        876                 -> <data type=float value='876'/>
        Symbol     'first'  -> <cue type=symbol id=first/>
        Symbol.for 'first'  -> <cue type=symbol id=first/>
        ```

```coffee
stream.push 'data', '#first', '#last', ( d ) ->
```

#### See Also

* in case more complicated selectors must be parsed: https://github.com/fb55/css-what

### Loupe, Show

* add `cfg` parameter
* implement stripping of ANSI codes
* implement 'colorful', 'symbolic' mode
* implement callbacks for specifc types / filters

### Random

* **`[—]`** Provide alternative to ditched `unique`, such as filling a `Set` to a certain size with
  characters
* **`[—]`** Provide internal implementations that capture attempt counts for testing, better insights
* **`[—]`** use custom class for `stats` that handles excessive retry counts
* **`[—]`** implement iterators
* **`[—]`** should `on_exhaustion`, `on_stats`, `max_retries` be implemented for each method?

#### Random: Implementation Structure

* the library currently supports four data types to generate instance values for: `float`, `integer`, `chr`,
  `text`
* for each case, instance values can be produced...
  * ...that are not smaller than a given `min`imum and not larger than a given `max`imum
  * ...that are `filter`ed according to a given RegEx pattern or an arbitrary function
  * ...that, in the case of `text`s, are not shorter and not longer than a given pair of `min`imum`_length`
    and `max`imum`_length`
  * ...that are unique in relation to a given collection (IOW that are new to a given collection)

* the foundational Pseudo-Random Number Generator (PRNG) that enables the generation of pseudo-random values
  is piece of code that I [found on the
  Internet](https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript)
  (duh), is called [*SplitMix32*](https://stackoverflow.com/a/47593316/7568091) and is, according to the
  poster,

  > A 32-bit state PRNG that was made by taking MurmurHash3's mixing function, adding a incrementor and
  > tweaking the constants. It's potentially one of the better 32-bit PRNGs so far; even the author of
  > Mulberry32 considers it to be the better choice. It's also just as fast.

* Like JavaScript's built-in `Math.random()` generator, this PRNG will generate evenly distributed values
  `t` between `0` (inclusive) and `1` (exclusive) (i.e. `0 < t ≤ 1`), but other than `Math.random()`, it
  allows to be given a `seed` to set its state to a known fixed point, from whence the series of random
  numbers to be generated will remain constant for each instantiation. This randomly-deterministic (or
  deterministically random, or 'random but foreseeable') operation is valuable for testing.

* Since the random core value `t` (accessible as `Get_random::_float()`) is always in the interval `[0,1)`,
  it's straightforward to both scale (stretch or shrink) it to any other length `[0,p)` and / or transpose
  (shift left or right) it to any other starting point `[q,q+1)`, meaning it can be projected into any
  interval `[min,max)` by computing `j = min + ( t * ( max - min ) )`. That projected value `j` can then be
  rounded e.g. to an integer number `n`, and that integer `n` can be interpreted as a [Unicode Code
  Point](https://de.wikipedia.org/wiki/Codepoint) and be used in `String.fromCodePoint()` to obtain a
  'character'. Since many Unicode codepoints are unassigned or contain control characters, `Get_random`
  methods will filter codepoints to include only 'printable' characters. Lastly, characters can be
  concatenated to strings which, again, can be made shorter or longer, be built from filtered codepoints
  from a narrowed set like, say, `/^[a-zA-ZäöüÄÖÜß]$/` (most commonly used letters to write German), or
  adhere to some predefined pattern or other arbitrary restrictions. It all comes out of `[0,1)` which I
  find amazing.

* A further desirable restriction on random values that is sometimes encountered is the exclusion of
  duplicates; `Get_random` can help with that.

* each type has dedicated methods to produce instances of each type:
  * a convenience function bearing the name of the type: `Get_random::float()`, `Get_random::chr()` and so
    on. These convenience functions will call the associated 'producer methods'
    `Get_random::float_producer()`, `Get_random::chr_producer()` and so on which will analyze the arguments
    given and return a function that in turn will produce random values according to the specs indicated by
    the arguments.

##### References

* [Proposal to add `new Random.Seeded()` to
  JS](https://github.com/tc39/proposal-seeded-random?tab=readme-ov-file)

##### To Do

* **`[—]`** implement a 'raw codepoint' convenience method?
* **`[—]`** adapt `Get_random::float()`, `Get_random::integer()` to match `Get_random::chr()`,
  `Get_random::text()`
* **`[—]`** ensure `Get_random::cfgon_stats` is called when given even when missing or `null` in method call
* **`[—]`** need better `rpr()`
  * **`[—]`** one `rpr()` for use in texts such as error messages, one `rpr()` ('`show()`'?) for use in
    presentational contexts

### Benchmark

* **`[—]`** implement ?`min_count` / ?`max_count` / ?`min_dt` / ?`max_dt`, `prioritize: ( 'dt' | 'count' )`
  * probably best to stick with `min` or `max` for both `count` and `dt`

* **`[—]`** allow to call as `timeit name, -> ...` and / or `timeit { name, ..., }, -> ...` so function name
  can be overriden

* **`[—]`** implement 'tracks' / 'splits' such that within a `timeit()` run, the executed function can call
  sub-timers with `track track_name, -> ...`. Different contestants can re-use track names that can then be
  compared, ex.:

  ```coffee
  timeit contestant_a = ( { track, progress, } ) ->
    data = null
    track load_data         = -> data = a.load_data()
    a.do_other_stuff()
    track evaluate          = -> data = a.evaluate()
    track only_a_does_this  = -> data = a.only_a_does_this()
    track save_data         = -> data = a.save_data()
  timeit contestant_b = ( { track, progress, } ) ->
    data = null
    track load_data         = -> data = b.load_data()
    b.do_other_stuff()
    track evaluate          = -> data = b.evaluate()
    track save_data         = -> data = b.save_data()
  ```
  will show elapsed total times for `contestant_a`, `contestant_b`, as well as comparisons of tracks
  `contestant_a/load_data` v. `contestant_b/load_data`, `contestant_a/evaluate` v. `contestant_b/evaluate`
  and so on; track `contestant_a/only_a_does_this` is shown without comparison. There will inevitable also
  be an 'anonymous track', i.e. time spent by each contestant outside of any named track (here symbolized by
  `_.do_other_stuff()`, but in principle also comprising any part of the function between tracks, and time
  spent to set up and finish each track); these extra times should also be shown, at least when exceeding a
  given threshold. In `timeit()` runs that have no `track()` calls, the anonymous track is all there is.

* **`[—]`** incorporate functionality of `with_capture_output()` (setting `{ capture_output: true, }`),
  return stdout, stdin contents

### Errors

* **`[—]`** custom error base class
  * **`[—]`** or multiple ones, each derived from a built-in class such as `RangeError`, `TypeError`,
    `AggregateError`

* **`[—]`** solution to capture existing error, issue new one a la Python's `raise Error_2 from Error_1`

* **`[—]`** omit repeated lines when displaying `error.cause`?

### Remap

* **`[—]`** provide facility to retrieve all own keys (strings+symbols)
* **`[—]`** use property descriptors
* **`[—]`** can be expanded to provide `shallow_clone()`, `deep_clone()`


### Other

* **`[—]`** publish `clean()` solution to the 'Assign-Problem with Intermediate Nulls and Undefineds' in the
  context of a Bric-A-Brac SFModule


