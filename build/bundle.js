;(function (l, r) {
    if (l.getElementById('livereloadscript')) return
    r = l.createElement('script')
    r.async = 1
    r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'
    r.id = 'livereloadscript'
    l.getElementsByTagName('head')[0].appendChild(r)
})(window.document)
var app = (function () {
    'use strict'

    function noop() {}
    const identity = (x) => x
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char },
        }
    }
    function run(fn) {
        return fn()
    }
    function blank_object() {
        return Object.create(null)
    }
    function run_all(fns) {
        fns.forEach(run)
    }
    function is_function(thing) {
        return typeof thing === 'function'
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function'
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`)
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop
        }
        const unsub = store.subscribe(...callbacks)
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback))
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value)
        return ret
    }

    const is_client = typeof window !== 'undefined'
    let now = is_client ? () => window.performance.now() : () => Date.now()
    let raf = is_client ? (cb) => requestAnimationFrame(cb) : noop

    const tasks = new Set()
    function run_tasks(now) {
        tasks.forEach((task) => {
            if (!task.c(now)) {
                tasks.delete(task)
                task.f()
            }
        })
        if (tasks.size !== 0) raf(run_tasks)
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task
        if (tasks.size === 0) raf(run_tasks)
        return {
            promise: new Promise((fulfill) => {
                tasks.add((task = { c: callback, f: fulfill }))
            }),
            abort() {
                tasks.delete(task)
            },
        }
    }

    function append(target, node) {
        target.appendChild(node)
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null)
    }
    function detach(node) {
        node.parentNode.removeChild(node)
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i]) iterations[i].d(detaching)
        }
    }
    function element(name) {
        return document.createElement(name)
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name)
    }
    function text(data) {
        return document.createTextNode(data)
    }
    function space() {
        return text(' ')
    }
    function empty() {
        return text('')
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options)
        return () => node.removeEventListener(event, handler, options)
    }
    function attr(node, attribute, value) {
        if (value == null) node.removeAttribute(attribute)
        else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value)
    }
    function xlink_attr(node, attribute, value) {
        node.setAttributeNS('http://www.w3.org/1999/xlink', attribute, value)
    }
    function children(element) {
        return Array.from(element.childNodes)
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '')
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name)
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent')
        e.initCustomEvent(type, false, false, detail)
        return e
    }

    const active_docs = new Set()
    let active = 0
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381
        let i = str.length
        while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i)
        return hash >>> 0
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration
        let keyframes = '{\n'
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p)
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`
        const name = `__svelte_${hash(rule)}_${uid}`
        const doc = node.ownerDocument
        active_docs.add(doc)
        const stylesheet =
            doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet)
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {})
        if (!current_rules[name]) {
            current_rules[name] = true
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length)
        }
        const animation = node.style.animation || ''
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`
        active += 1
        return name
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ')
        const next = previous.filter(
            name
                ? (anim) => anim.indexOf(name) < 0 // remove specific animation
                : (anim) => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
        const deleted = previous.length - next.length
        if (deleted) {
            node.style.animation = next.join(', ')
            active -= deleted
            if (!active) clear_rules()
        }
    }
    function clear_rules() {
        raf(() => {
            if (active) return
            active_docs.forEach((doc) => {
                const stylesheet = doc.__svelte_stylesheet
                let i = stylesheet.cssRules.length
                while (i--) stylesheet.deleteRule(i)
                doc.__svelte_rules = {}
            })
            active_docs.clear()
        })
    }

    let current_component
    function set_current_component(component) {
        current_component = component
    }
    function get_current_component() {
        if (!current_component) throw new Error(`Function called outside component initialization`)
        return current_component
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn)
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type]
        if (callbacks) {
            callbacks.slice().forEach((fn) => fn(event))
        }
    }

    const dirty_components = []
    const binding_callbacks = []
    const render_callbacks = []
    const flush_callbacks = []
    const resolved_promise = Promise.resolve()
    let update_scheduled = false
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true
            resolved_promise.then(flush)
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn)
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn)
    }
    let flushing = false
    const seen_callbacks = new Set()
    function flush() {
        if (flushing) return
        flushing = true
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i]
                set_current_component(component)
                update(component.$$)
            }
            dirty_components.length = 0
            while (binding_callbacks.length) binding_callbacks.pop()()
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i]
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback)
                    callback()
                }
            }
            render_callbacks.length = 0
        } while (dirty_components.length)
        while (flush_callbacks.length) {
            flush_callbacks.pop()()
        }
        update_scheduled = false
        flushing = false
        seen_callbacks.clear()
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update()
            run_all($$.before_update)
            const dirty = $$.dirty
            $$.dirty = [-1]
            $$.fragment && $$.fragment.p($$.ctx, dirty)
            $$.after_update.forEach(add_render_callback)
        }
    }

    let promise
    function wait() {
        if (!promise) {
            promise = Promise.resolve()
            promise.then(() => {
                promise = null
            })
        }
        return promise
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`))
    }
    const outroing = new Set()
    let outros
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros, // parent group
        }
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c)
        }
        outros = outros.p
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block)
            block.i(local)
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block)) return
            outroing.add(block)
            outros.c.push(() => {
                outroing.delete(block)
                if (callback) {
                    if (detach) block.d(1)
                    callback()
                }
            })
            block.o(local)
        }
    }
    const null_transition = { duration: 0 }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params)
        let t = intro ? 0 : 1
        let running_program = null
        let pending_program = null
        let animation_name = null
        function clear_animation() {
            if (animation_name) delete_rule(node, animation_name)
        }
        function init(program, duration) {
            const d = program.b - t
            duration *= Math.abs(d)
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group,
            }
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition
            const program = {
                start: now() + delay,
                b,
            }
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros
                outros.r += 1
            }
            if (running_program) {
                pending_program = program
            } else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation()
                    animation_name = create_rule(node, t, b, duration, delay, easing, css)
                }
                if (b) tick(0, 1)
                running_program = init(program, duration)
                add_render_callback(() => dispatch(node, b, 'start'))
                loop((now) => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration)
                        pending_program = null
                        dispatch(node, running_program.b, 'start')
                        if (css) {
                            clear_animation()
                            animation_name = create_rule(
                                node,
                                t,
                                running_program.b,
                                running_program.duration,
                                0,
                                easing,
                                config.css
                            )
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick((t = running_program.b), 1 - t)
                            dispatch(node, running_program.b, 'end')
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation()
                                } else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r) run_all(running_program.group.c)
                                }
                            }
                            running_program = null
                        } else if (now >= running_program.start) {
                            const p = now - running_program.start
                            t = running_program.a + running_program.d * easing(p / running_program.duration)
                            tick(t, 1 - t)
                        }
                    }
                    return !!(running_program || pending_program)
                })
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config()
                        go(b)
                    })
                } else {
                    go(b)
                }
            },
            end() {
                clear_animation()
                running_program = pending_program = null
            },
        }
    }

    const globals = typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : global

    function bind(component, name, callback) {
        const index = component.$$.props[name]
        if (index !== undefined) {
            component.$$.bound[index] = callback
            callback(component.$$.ctx[index])
        }
    }
    function create_component(block) {
        block && block.c()
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$
        fragment && fragment.m(target, anchor)
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function)
            if (on_destroy) {
                on_destroy.push(...new_on_destroy)
            } else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy)
            }
            component.$$.on_mount = []
        })
        after_update.forEach(add_render_callback)
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$
        if ($$.fragment !== null) {
            run_all($$.on_destroy)
            $$.fragment && $$.fragment.d(detaching)
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null
            $$.ctx = []
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component)
            schedule_update()
            component.$$.dirty.fill(0)
        }
        component.$$.dirty[(i / 31) | 0] |= 1 << i % 31
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component
        set_current_component(component)
        const prop_values = options.props || {}
        const $$ = (component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
        })
        let ready = false
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                  const value = rest.length ? rest[0] : ret
                  if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
                      if ($$.bound[i]) $$.bound[i](value)
                      if (ready) make_dirty(component, i)
                  }
                  return ret
              })
            : []
        $$.update()
        ready = true
        run_all($$.before_update)
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target)
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes)
                nodes.forEach(detach)
            } else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c()
            }
            if (options.intro) transition_in(component.$$.fragment)
            mount_component(component, options.target, options.anchor)
            flush()
        }
        set_current_component(parent_component)
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1)
            this.$destroy = noop
        }
        $on(type, callback) {
            const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = [])
            callbacks.push(callback)
            return () => {
                const index = callbacks.indexOf(callback)
                if (index !== -1) callbacks.splice(index, 1)
            }
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.3' }, detail)))
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node })
        append(target, node)
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor })
        insert(target, node, anchor)
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node })
        detach(node)
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : []
        if (has_prevent_default) modifiers.push('preventDefault')
        if (has_stop_propagation) modifiers.push('stopPropagation')
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers })
        const dispose = listen(node, event, handler, options)
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers })
            dispose()
        }
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value)
        if (value == null) dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute })
        else dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value })
    }
    function prop_dev(node, property, value) {
        node[property] = value
        dispatch_dev('SvelteDOMSetProperty', { node, property, value })
    }
    function set_data_dev(text, data) {
        data = '' + data
        if (text.data === data) return
        dispatch_dev('SvelteDOMSetData', { node: text, data })
        text.data = data
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.'
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.'
            }
            throw new Error(msg)
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`)
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`)
            }
            super()
        }
        $destroy() {
            super.$destroy()
            this.$destroy = () => {
                console.warn(`Component was already destroyed`) // eslint-disable-line no-console
            }
        }
        $capture_state() {}
        $inject_state() {}
    }

    /* src/svelte/components/Shrimp.svelte generated by Svelte v3.22.3 */

    const file = 'src/svelte/components/Shrimp.svelte'

    function get_each_context(ctx, list, i) {
        const child_ctx = ctx.slice()
        child_ctx[1] = list[i]
        child_ctx[3] = i
        return child_ctx
    }

    // (7:0) {#each shrimpPositions as position, i}
    function create_each_block(ctx) {
        let div

        const block = {
            c: function create() {
                div = element('div')
                set_style(div, 'left', /*position*/ ctx[1].x + 'px')
                set_style(div, 'top', /*position*/ ctx[1].y + 'px')
                attr_dev(div, 'class', 'body svelte-1pwop52')
                add_location(div, file, 7, 4, 92)
            },
            m: function mount(target, anchor) {
                insert_dev(target, div, anchor)
            },
            p: function update(ctx, dirty) {
                if (dirty & /*shrimpPositions*/ 1) {
                    set_style(div, 'left', /*position*/ ctx[1].x + 'px')
                }

                if (dirty & /*shrimpPositions*/ 1) {
                    set_style(div, 'top', /*position*/ ctx[1].y + 'px')
                }
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div)
            },
        }

        dispatch_dev('SvelteRegisterBlock', {
            block,
            id: create_each_block.name,
            type: 'each',
            source: '(7:0) {#each shrimpPositions as position, i}',
            ctx,
        })

        return block
    }

    function create_fragment(ctx) {
        let each_1_anchor
        let each_value = /*shrimpPositions*/ ctx[0]
        validate_each_argument(each_value)
        let each_blocks = []

        for (let i = 0; i < each_value.length; i += 1) {
            each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i))
        }

        const block = {
            c: function create() {
                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c()
                }

                each_1_anchor = empty()
            },
            l: function claim(nodes) {
                throw new Error(
                    'options.hydrate only works if the component was compiled with the `hydratable: true` option'
                )
            },
            m: function mount(target, anchor) {
                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].m(target, anchor)
                }

                insert_dev(target, each_1_anchor, anchor)
            },
            p: function update(ctx, [dirty]) {
                if (dirty & /*shrimpPositions*/ 1) {
                    each_value = /*shrimpPositions*/ ctx[0]
                    validate_each_argument(each_value)
                    let i

                    for (i = 0; i < each_value.length; i += 1) {
                        const child_ctx = get_each_context(ctx, each_value, i)

                        if (each_blocks[i]) {
                            each_blocks[i].p(child_ctx, dirty)
                        } else {
                            each_blocks[i] = create_each_block(child_ctx)
                            each_blocks[i].c()
                            each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor)
                        }
                    }

                    for (; i < each_blocks.length; i += 1) {
                        each_blocks[i].d(1)
                    }

                    each_blocks.length = each_value.length
                }
            },
            i: noop,
            o: noop,
            d: function destroy(detaching) {
                destroy_each(each_blocks, detaching)
                if (detaching) detach_dev(each_1_anchor)
            },
        }

        dispatch_dev('SvelteRegisterBlock', {
            block,
            id: create_fragment.name,
            type: 'component',
            source: '',
            ctx,
        })

        return block
    }

    function instance($$self, $$props, $$invalidate) {
        let { shrimpPositions } = $$props
        const writable_props = ['shrimpPositions']

        Object.keys($$props).forEach((key) => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$')
                console.warn(`<Shrimp> was created with unknown prop '${key}'`)
        })

        let { $$slots = {}, $$scope } = $$props
        validate_slots('Shrimp', $$slots, [])

        $$self.$set = ($$props) => {
            if ('shrimpPositions' in $$props) $$invalidate(0, (shrimpPositions = $$props.shrimpPositions))
        }

        $$self.$capture_state = () => ({ shrimpPositions })

        $$self.$inject_state = ($$props) => {
            if ('shrimpPositions' in $$props) $$invalidate(0, (shrimpPositions = $$props.shrimpPositions))
        }

        if ($$props && '$$inject' in $$props) {
            $$self.$inject_state($$props.$$inject)
        }

        return [shrimpPositions]
    }

    class Shrimp extends SvelteComponentDev {
        constructor(options) {
            super(options)
            init(this, options, instance, create_fragment, safe_not_equal, { shrimpPositions: 0 })

            dispatch_dev('SvelteRegisterComponent', {
                component: this,
                tagName: 'Shrimp',
                options,
                id: create_fragment.name,
            })

            const { ctx } = this.$$
            const props = options.props || {}

            if (/*shrimpPositions*/ ctx[0] === undefined && !('shrimpPositions' in props)) {
                console.warn("<Shrimp> was created without expected prop 'shrimpPositions'")
            }
        }

        get shrimpPositions() {
            throw new Error(
                "<Shrimp>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'"
            )
        }

        set shrimpPositions(value) {
            throw new Error(
                "<Shrimp>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'"
            )
        }
    }

    /* src/svelte/ui/Icon.svelte generated by Svelte v3.22.3 */

    const file$1 = 'src/svelte/ui/Icon.svelte'

    function create_fragment$1(ctx) {
        let svg
        let use
        let use_xlink_href_value
        let svg_class_value
        let dispose

        const block = {
            c: function create() {
                svg = svg_element('svg')
                use = svg_element('use')
                xlink_attr(use, 'xlink:href', (use_xlink_href_value = './icons-sprite.svg#' + /*iconName*/ ctx[0]))
                add_location(use, file$1, 7, 4, 150)
                attr_dev(svg, 'style', /*style*/ ctx[2])
                attr_dev(svg, 'class', (svg_class_value = 'icon ' + /*cssClass*/ ctx[1] + ' svelte-z92nov'))
                add_location(svg, file$1, 6, 0, 99)
            },
            l: function claim(nodes) {
                throw new Error(
                    'options.hydrate only works if the component was compiled with the `hydratable: true` option'
                )
            },
            m: function mount(target, anchor, remount) {
                insert_dev(target, svg, anchor)
                append_dev(svg, use)
                if (remount) dispose()
                dispose = listen_dev(svg, 'click', /*click_handler*/ ctx[3], false, false, false)
            },
            p: function update(ctx, [dirty]) {
                if (
                    dirty & /*iconName*/ 1 &&
                    use_xlink_href_value !== (use_xlink_href_value = './icons-sprite.svg#' + /*iconName*/ ctx[0])
                ) {
                    xlink_attr(use, 'xlink:href', use_xlink_href_value)
                }

                if (dirty & /*style*/ 4) {
                    attr_dev(svg, 'style', /*style*/ ctx[2])
                }

                if (
                    dirty & /*cssClass*/ 2 &&
                    svg_class_value !== (svg_class_value = 'icon ' + /*cssClass*/ ctx[1] + ' svelte-z92nov')
                ) {
                    attr_dev(svg, 'class', svg_class_value)
                }
            },
            i: noop,
            o: noop,
            d: function destroy(detaching) {
                if (detaching) detach_dev(svg)
                dispose()
            },
        }

        dispatch_dev('SvelteRegisterBlock', {
            block,
            id: create_fragment$1.name,
            type: 'component',
            source: '',
            ctx,
        })

        return block
    }

    function instance$1($$self, $$props, $$invalidate) {
        let { iconName } = $$props
        let { cssClass = '' } = $$props
        let { style = '' } = $$props
        const writable_props = ['iconName', 'cssClass', 'style']

        Object.keys($$props).forEach((key) => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$')
                console.warn(`<Icon> was created with unknown prop '${key}'`)
        })

        let { $$slots = {}, $$scope } = $$props
        validate_slots('Icon', $$slots, [])

        function click_handler(event) {
            bubble($$self, event)
        }

        $$self.$set = ($$props) => {
            if ('iconName' in $$props) $$invalidate(0, (iconName = $$props.iconName))
            if ('cssClass' in $$props) $$invalidate(1, (cssClass = $$props.cssClass))
            if ('style' in $$props) $$invalidate(2, (style = $$props.style))
        }

        $$self.$capture_state = () => ({ iconName, cssClass, style })

        $$self.$inject_state = ($$props) => {
            if ('iconName' in $$props) $$invalidate(0, (iconName = $$props.iconName))
            if ('cssClass' in $$props) $$invalidate(1, (cssClass = $$props.cssClass))
            if ('style' in $$props) $$invalidate(2, (style = $$props.style))
        }

        if ($$props && '$$inject' in $$props) {
            $$self.$inject_state($$props.$$inject)
        }

        return [iconName, cssClass, style, click_handler]
    }

    class Icon extends SvelteComponentDev {
        constructor(options) {
            super(options)
            init(this, options, instance$1, create_fragment$1, safe_not_equal, { iconName: 0, cssClass: 1, style: 2 })

            dispatch_dev('SvelteRegisterComponent', {
                component: this,
                tagName: 'Icon',
                options,
                id: create_fragment$1.name,
            })

            const { ctx } = this.$$
            const props = options.props || {}

            if (/*iconName*/ ctx[0] === undefined && !('iconName' in props)) {
                console.warn("<Icon> was created without expected prop 'iconName'")
            }
        }

        get iconName() {
            throw new Error(
                "<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'"
            )
        }

        set iconName(value) {
            throw new Error(
                "<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'"
            )
        }

        get cssClass() {
            throw new Error(
                "<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'"
            )
        }

        set cssClass(value) {
            throw new Error(
                "<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'"
            )
        }

        get style() {
            throw new Error(
                "<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'"
            )
        }

        set style(value) {
            throw new Error(
                "<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'"
            )
        }
    }

    /* src/svelte/components/FeedItems.svelte generated by Svelte v3.22.3 */
    const file$2 = 'src/svelte/components/FeedItems.svelte'

    function get_each_context$1(ctx, list, i) {
        const child_ctx = ctx.slice()
        child_ctx[2] = list[i]
        return child_ctx
    }

    // (17:0) {#each feedItems as feed}
    function create_each_block$1(ctx) {
        let div
        let t
        let current

        const icon = new Icon({
            props: {
                iconName: /*feedMap*/ ctx[1][/*feed*/ ctx[2].score],
            },
            $$inline: true,
        })

        const block = {
            c: function create() {
                div = element('div')
                create_component(icon.$$.fragment)
                t = space()
                attr_dev(div, 'class', 'feed svelte-1x5u9ae')
                set_style(div, 'left', /*feed*/ ctx[2].x + 'px')
                set_style(div, 'top', /*feed*/ ctx[2].y + 'px')
                add_location(div, file$2, 17, 4, 296)
            },
            m: function mount(target, anchor) {
                insert_dev(target, div, anchor)
                mount_component(icon, div, null)
                append_dev(div, t)
                current = true
            },
            p: function update(ctx, dirty) {
                const icon_changes = {}
                if (dirty & /*feedItems*/ 1) icon_changes.iconName = /*feedMap*/ ctx[1][/*feed*/ ctx[2].score]
                icon.$set(icon_changes)

                if (!current || dirty & /*feedItems*/ 1) {
                    set_style(div, 'left', /*feed*/ ctx[2].x + 'px')
                }

                if (!current || dirty & /*feedItems*/ 1) {
                    set_style(div, 'top', /*feed*/ ctx[2].y + 'px')
                }
            },
            i: function intro(local) {
                if (current) return
                transition_in(icon.$$.fragment, local)
                current = true
            },
            o: function outro(local) {
                transition_out(icon.$$.fragment, local)
                current = false
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div)
                destroy_component(icon)
            },
        }

        dispatch_dev('SvelteRegisterBlock', {
            block,
            id: create_each_block$1.name,
            type: 'each',
            source: '(17:0) {#each feedItems as feed}',
            ctx,
        })

        return block
    }

    function create_fragment$2(ctx) {
        let each_1_anchor
        let current
        let each_value = /*feedItems*/ ctx[0]
        validate_each_argument(each_value)
        let each_blocks = []

        for (let i = 0; i < each_value.length; i += 1) {
            each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i))
        }

        const out = (i) =>
            transition_out(each_blocks[i], 1, 1, () => {
                each_blocks[i] = null
            })

        const block = {
            c: function create() {
                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c()
                }

                each_1_anchor = empty()
            },
            l: function claim(nodes) {
                throw new Error(
                    'options.hydrate only works if the component was compiled with the `hydratable: true` option'
                )
            },
            m: function mount(target, anchor) {
                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].m(target, anchor)
                }

                insert_dev(target, each_1_anchor, anchor)
                current = true
            },
            p: function update(ctx, [dirty]) {
                if (dirty & /*feedItems, feedMap*/ 3) {
                    each_value = /*feedItems*/ ctx[0]
                    validate_each_argument(each_value)
                    let i

                    for (i = 0; i < each_value.length; i += 1) {
                        const child_ctx = get_each_context$1(ctx, each_value, i)

                        if (each_blocks[i]) {
                            each_blocks[i].p(child_ctx, dirty)
                            transition_in(each_blocks[i], 1)
                        } else {
                            each_blocks[i] = create_each_block$1(child_ctx)
                            each_blocks[i].c()
                            transition_in(each_blocks[i], 1)
                            each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor)
                        }
                    }

                    group_outros()

                    for (i = each_value.length; i < each_blocks.length; i += 1) {
                        out(i)
                    }

                    check_outros()
                }
            },
            i: function intro(local) {
                if (current) return

                for (let i = 0; i < each_value.length; i += 1) {
                    transition_in(each_blocks[i])
                }

                current = true
            },
            o: function outro(local) {
                each_blocks = each_blocks.filter(Boolean)

                for (let i = 0; i < each_blocks.length; i += 1) {
                    transition_out(each_blocks[i])
                }

                current = false
            },
            d: function destroy(detaching) {
                destroy_each(each_blocks, detaching)
                if (detaching) detach_dev(each_1_anchor)
            },
        }

        dispatch_dev('SvelteRegisterBlock', {
            block,
            id: create_fragment$2.name,
            type: 'component',
            source: '',
            ctx,
        })

        return block
    }

    function instance$2($$self, $$props, $$invalidate) {
        let { feedItems } = $$props

        let feedMap = {
            '-1': 'mushroom',
            0: 'gamepad',
            1: 'shrimp-1',
            2: 'gold-shrimp-1',
            3: 'shrimp-pair',
            4: 'lobster',
        }

        const writable_props = ['feedItems']

        Object.keys($$props).forEach((key) => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$')
                console.warn(`<FeedItems> was created with unknown prop '${key}'`)
        })

        let { $$slots = {}, $$scope } = $$props
        validate_slots('FeedItems', $$slots, [])

        $$self.$set = ($$props) => {
            if ('feedItems' in $$props) $$invalidate(0, (feedItems = $$props.feedItems))
        }

        $$self.$capture_state = () => ({ Icon, feedItems, feedMap })

        $$self.$inject_state = ($$props) => {
            if ('feedItems' in $$props) $$invalidate(0, (feedItems = $$props.feedItems))
            if ('feedMap' in $$props) $$invalidate(1, (feedMap = $$props.feedMap))
        }

        if ($$props && '$$inject' in $$props) {
            $$self.$inject_state($$props.$$inject)
        }

        return [feedItems, feedMap]
    }

    class FeedItems extends SvelteComponentDev {
        constructor(options) {
            super(options)
            init(this, options, instance$2, create_fragment$2, safe_not_equal, { feedItems: 0 })

            dispatch_dev('SvelteRegisterComponent', {
                component: this,
                tagName: 'FeedItems',
                options,
                id: create_fragment$2.name,
            })

            const { ctx } = this.$$
            const props = options.props || {}

            if (/*feedItems*/ ctx[0] === undefined && !('feedItems' in props)) {
                console.warn("<FeedItems> was created without expected prop 'feedItems'")
            }
        }

        get feedItems() {
            throw new Error(
                "<FeedItems>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'"
            )
        }

        set feedItems(value) {
            throw new Error(
                "<FeedItems>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'"
            )
        }
    }

    const subscriber_queue = []
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop
        const subscribers = []
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value
                if (stop) {
                    // store is ready
                    const run_queue = !subscriber_queue.length
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i]
                        s[1]()
                        subscriber_queue.push(s, value)
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1])
                        }
                        subscriber_queue.length = 0
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value))
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate]
            subscribers.push(subscriber)
            if (subscribers.length === 1) {
                stop = start(set) || noop
            }
            run(value)
            return () => {
                const index = subscribers.indexOf(subscriber)
                if (index !== -1) {
                    subscribers.splice(index, 1)
                }
                if (subscribers.length === 0) {
                    stop()
                    stop = null
                }
            }
        }
        return { set, update, subscribe }
    }

    const options = writable({
        advanced: false,
        gameMap: '3HeadedMonster',
        music: '',
    })

    function cubicOut(t) {
        const f = t - 1.0
        return f * f * f + 1.0
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity
        return {
            delay,
            duration,
            easing,
            css: (t) => `opacity: ${t * o}`,
        }
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node)
        const target_opacity = +style.opacity
        const transform = style.transform === 'none' ? '' : style.transform
        const od = target_opacity * (1 - opacity)
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - od * u}`,
        }
    }

    var GamePlayUtils = {
        moveShrimp,
        collision,
        getNewFeedItems,
        isReverse,
        getKeyCodeDirection,
    }

    function moveShrimp(direction, head) {
        switch (direction) {
            case 'left':
                head.x -= 25
                break
            case 'up':
                head.y -= 25
                break
            case 'right':
                head.x += 25
                break
            case 'down':
                head.y += 25
                break
        }
        return head
    }

    function collision(pos1, pos2) {
        return pos1.x === pos2.x && pos1.y === pos2.y
    }

    function getNewFeedItems(times, level) {
        switch (level) {
            case 1:
                return Array(times).fill({ score: Math.ceil(Math.random() * 2), ..._generateNewPosition() })
            case 2:
                return Array(Math.ceil(Math.random() * times)).fill({
                    score: Math.ceil(Math.random() * 3),
                    ..._generateNewPosition(),
                })
            case 3:
                return Array(Math.ceil(Math.random() * times)).fill({
                    score: Math.ceil(Math.random() * 4),
                    ..._generateNewPosition(),
                })
            case 4:
                return Array(Math.ceil(Math.random() * times)).fill({
                    score: -1,
                    life: -1,
                    ..._generateNewPosition(),
                })
            case 5:
                return Array(Math.ceil(Math.random() * times)).fill({
                    score: 0,
                    life: 1,
                    ..._generateNewPosition(),
                })
        }
    }

    function _generateNewPosition() {
        return {
            x: Math.floor(Math.random() * 20) * 50,
            y: Math.floor(Math.random() * 14) * 50,
        }
    }

    function isReverse(direction, newDirection) {
        switch (direction) {
            case 'left':
                return newDirection === 'right'
            case 'up':
                return newDirection === 'down'
            case 'right':
                return newDirection === 'left'
            case 'down':
                return newDirection === 'up'
        }
        return false
    }

    function getKeyCodeDirection(keyCode) {
        switch (keyCode) {
            case 37:
                return 'left'
            case 38:
                return 'up'
            case 39:
                return 'right'
            case 40:
                return 'down'
            default:
                return ''
        }
    }
    var GamePlayUtils_1 = GamePlayUtils.moveShrimp
    var GamePlayUtils_2 = GamePlayUtils.collision
    var GamePlayUtils_3 = GamePlayUtils.getNewFeedItems
    var GamePlayUtils_4 = GamePlayUtils.isReverse
    var GamePlayUtils_5 = GamePlayUtils.getKeyCodeDirection

    /* src/svelte/components/GamePlay.svelte generated by Svelte v3.22.3 */

    const { console: console_1 } = globals

    const file$3 = 'src/svelte/components/GamePlay.svelte'

    // (136:4) {#if gameRunning}
    function create_if_block_2(ctx) {
        let t
        let current

        const shrimp = new Shrimp({
            props: {
                shrimpPositions: /*shrimpPositions*/ ctx[3],
            },
            $$inline: true,
        })

        const feeditems = new FeedItems({
            props: { feedItems: /*feedItems*/ ctx[4] },
            $$inline: true,
        })

        const block = {
            c: function create() {
                create_component(shrimp.$$.fragment)
                t = space()
                create_component(feeditems.$$.fragment)
            },
            m: function mount(target, anchor) {
                mount_component(shrimp, target, anchor)
                insert_dev(target, t, anchor)
                mount_component(feeditems, target, anchor)
                current = true
            },
            p: function update(ctx, dirty) {
                const shrimp_changes = {}
                if (dirty & /*shrimpPositions*/ 8) shrimp_changes.shrimpPositions = /*shrimpPositions*/ ctx[3]
                shrimp.$set(shrimp_changes)
                const feeditems_changes = {}
                if (dirty & /*feedItems*/ 16) feeditems_changes.feedItems = /*feedItems*/ ctx[4]
                feeditems.$set(feeditems_changes)
            },
            i: function intro(local) {
                if (current) return
                transition_in(shrimp.$$.fragment, local)
                transition_in(feeditems.$$.fragment, local)
                current = true
            },
            o: function outro(local) {
                transition_out(shrimp.$$.fragment, local)
                transition_out(feeditems.$$.fragment, local)
                current = false
            },
            d: function destroy(detaching) {
                destroy_component(shrimp, detaching)
                if (detaching) detach_dev(t)
                destroy_component(feeditems, detaching)
            },
        }

        dispatch_dev('SvelteRegisterBlock', {
            block,
            id: create_if_block_2.name,
            type: 'if',
            source: '(136:4) {#if gameRunning}',
            ctx,
        })

        return block
    }

    // (147:27)
    function create_if_block_1(ctx) {
        let p
        let p_transition
        let current

        const block = {
            c: function create() {
                p = element('p')
                p.textContent = 'Press any arrow key to begin playing.'
                attr_dev(p, 'class', 'svelte-vbtg08')
                add_location(p, file$3, 147, 8, 4462)
            },
            m: function mount(target, anchor) {
                insert_dev(target, p, anchor)
                current = true
            },
            p: noop,
            i: function intro(local) {
                if (current) return

                add_render_callback(() => {
                    if (!p_transition) p_transition = create_bidirectional_transition(p, fade, {}, true)
                    p_transition.run(1)
                })

                current = true
            },
            o: function outro(local) {
                if (!p_transition) p_transition = create_bidirectional_transition(p, fade, {}, false)
                p_transition.run(0)
                current = false
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(p)
                if (detaching && p_transition) p_transition.end()
            },
        }

        dispatch_dev('SvelteRegisterBlock', {
            block,
            id: create_if_block_1.name,
            type: 'if',
            source: '(147:27) ',
            ctx,
        })

        return block
    }

    // (140:4) {#if gameOver}
    function create_if_block(ctx) {
        let div
        let p0
        let t1
        let p1
        let t2
        let t3_value = /*stat*/ ctx[0].score + ''
        let t3
        let t4
        let p2
        let t5
        let t6_value = /*stat*/ ctx[0].lives + ''
        let t6
        let t7
        let div_transition
        let current

        const icon = new Icon({
            props: { cssClass: 'restart', iconName: 'restart' },
            $$inline: true,
        })

        icon.$on('click', /*startGame*/ ctx[5])

        const block = {
            c: function create() {
                div = element('div')
                p0 = element('p')
                p0.textContent = 'Game Over!'
                t1 = space()
                p1 = element('p')
                t2 = text('Score: ')
                t3 = text(t3_value)
                t4 = space()
                p2 = element('p')
                t5 = text('Lives: ')
                t6 = text(t6_value)
                t7 = space()
                create_component(icon.$$.fragment)
                attr_dev(p0, 'class', 'svelte-vbtg08')
                add_location(p0, file$3, 141, 12, 4236)
                attr_dev(p1, 'class', 'svelte-vbtg08')
                add_location(p1, file$3, 142, 12, 4266)
                attr_dev(p2, 'class', 'svelte-vbtg08')
                add_location(p2, file$3, 143, 12, 4305)
                add_location(div, file$3, 140, 8, 4172)
            },
            m: function mount(target, anchor) {
                insert_dev(target, div, anchor)
                append_dev(div, p0)
                append_dev(div, t1)
                append_dev(div, p1)
                append_dev(p1, t2)
                append_dev(p1, t3)
                append_dev(div, t4)
                append_dev(div, p2)
                append_dev(p2, t5)
                append_dev(p2, t6)
                append_dev(div, t7)
                mount_component(icon, div, null)
                current = true
            },
            p: function update(ctx, dirty) {
                if ((!current || dirty & /*stat*/ 1) && t3_value !== (t3_value = /*stat*/ ctx[0].score + ''))
                    set_data_dev(t3, t3_value)
                if ((!current || dirty & /*stat*/ 1) && t6_value !== (t6_value = /*stat*/ ctx[0].lives + ''))
                    set_data_dev(t6, t6_value)
            },
            i: function intro(local) {
                if (current) return
                transition_in(icon.$$.fragment, local)

                add_render_callback(() => {
                    if (!div_transition)
                        div_transition = create_bidirectional_transition(div, fly, { y: 200, duration: 2000 }, true)
                    div_transition.run(1)
                })

                current = true
            },
            o: function outro(local) {
                transition_out(icon.$$.fragment, local)
                if (!div_transition)
                    div_transition = create_bidirectional_transition(div, fly, { y: 200, duration: 2000 }, false)
                div_transition.run(0)
                current = false
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div)
                destroy_component(icon)
                if (detaching && div_transition) div_transition.end()
            },
        }

        dispatch_dev('SvelteRegisterBlock', {
            block,
            id: create_if_block.name,
            type: 'if',
            source: '(140:4) {#if gameOver}',
            ctx,
        })

        return block
    }

    function create_fragment$3(ctx) {
        let div
        let t
        let current_block_type_index
        let if_block1
        let current
        let dispose
        let if_block0 = /*gameRunning*/ ctx[2] && create_if_block_2(ctx)
        const if_block_creators = [create_if_block, create_if_block_1]
        const if_blocks = []

        function select_block_type(ctx, dirty) {
            if (/*gameOver*/ ctx[1]) return 0
            if (!(/*gameRunning*/ ctx[2])) return 1
            return -1
        }

        if (~(current_block_type_index = select_block_type(ctx))) {
            if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx)
        }

        const block = {
            c: function create() {
                div = element('div')
                if (if_block0) if_block0.c()
                t = space()
                if (if_block1) if_block1.c()
                attr_dev(div, 'class', 'game-play')
                add_location(div, file$3, 134, 0, 4019)
            },
            l: function claim(nodes) {
                throw new Error(
                    'options.hydrate only works if the component was compiled with the `hydratable: true` option'
                )
            },
            m: function mount(target, anchor, remount) {
                insert_dev(target, div, anchor)
                if (if_block0) if_block0.m(div, null)
                append_dev(div, t)

                if (~current_block_type_index) {
                    if_blocks[current_block_type_index].m(div, null)
                }

                current = true
                if (remount) dispose()
                dispose = listen_dev(window, 'keydown', /*onKeyDown*/ ctx[6], false, false, false)
            },
            p: function update(ctx, [dirty]) {
                if (/*gameRunning*/ ctx[2]) {
                    if (if_block0) {
                        if_block0.p(ctx, dirty)

                        if (dirty & /*gameRunning*/ 4) {
                            transition_in(if_block0, 1)
                        }
                    } else {
                        if_block0 = create_if_block_2(ctx)
                        if_block0.c()
                        transition_in(if_block0, 1)
                        if_block0.m(div, t)
                    }
                } else if (if_block0) {
                    group_outros()

                    transition_out(if_block0, 1, 1, () => {
                        if_block0 = null
                    })

                    check_outros()
                }

                let previous_block_index = current_block_type_index
                current_block_type_index = select_block_type(ctx)

                if (current_block_type_index === previous_block_index) {
                    if (~current_block_type_index) {
                        if_blocks[current_block_type_index].p(ctx, dirty)
                    }
                } else {
                    if (if_block1) {
                        group_outros()

                        transition_out(if_blocks[previous_block_index], 1, 1, () => {
                            if_blocks[previous_block_index] = null
                        })

                        check_outros()
                    }

                    if (~current_block_type_index) {
                        if_block1 = if_blocks[current_block_type_index]

                        if (!if_block1) {
                            if_block1 = if_blocks[current_block_type_index] = if_block_creators[
                                current_block_type_index
                            ](ctx)
                            if_block1.c()
                        }

                        transition_in(if_block1, 1)
                        if_block1.m(div, null)
                    } else {
                        if_block1 = null
                    }
                }
            },
            i: function intro(local) {
                if (current) return
                transition_in(if_block0)
                transition_in(if_block1)
                current = true
            },
            o: function outro(local) {
                transition_out(if_block0)
                transition_out(if_block1)
                current = false
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div)
                if (if_block0) if_block0.d()

                if (~current_block_type_index) {
                    if_blocks[current_block_type_index].d()
                }

                dispose()
            },
        }

        dispatch_dev('SvelteRegisterBlock', {
            block,
            id: create_fragment$3.name,
            type: 'component',
            source: '',
            ctx,
        })

        return block
    }

    function instance$3($$self, $$props, $$invalidate) {
        let $options
        validate_store(options, 'options')
        component_subscribe($$self, options, ($$value) => $$invalidate(10, ($options = $$value)))
        let gameOver = false
        let gameRunning = false
        let intervalId
        let shrimpPositions = [
            { x: 50, y: 350 },
            { x: 25, y: 350 },
            { x: 0, y: 350 },
        ]
        let direction = ''
        let feedItems
        let { stat } = $$props

        function startGame() {
            initialState()

            intervalId = setInterval(() => {
                if (!direction || gameOver) {
                    return
                }

                shrimpPositions.pop()
                const { ...curHead } = shrimpPositions[0]
                const newHead = GamePlayUtils_1(direction, curHead)
                $$invalidate(3, (shrimpPositions = [newHead, ...shrimpPositions]))

                if (isGameOver()) {
                    return
                }

                feedItems.forEach((feed, idx) => {
                    if (GamePlayUtils_2(newHead, feed)) {
                        console.log('FEEDITEMS111', JSON.stringify(feedItems))
                        const consumedFeed = feedItems.splice(idx, 1, ...generateNewFeedItems())[0]
                        $$invalidate(4, feedItems)
                        console.log('FEEDITEMS', JSON.stringify(feedItems))
                        $$invalidate(0, (stat.score = stat.score + (consumedFeed.score || 0) + 15), stat)
                        $$invalidate(0, (stat.lives = stat.lives + (consumedFeed.life || 0)), stat)

                        if (stat.score > 15 && $options.music !== 'terror.mp3') {
                            set_store_value(options, ($options.music = 'terror.mp3'), $options)
                        }

                        $$invalidate(3, (shrimpPositions = [...shrimpPositions, shrimpPositions[1]]))
                    }
                })
            }, interval)
        }

        function generateNewFeedItems() {
            let newFeeds = []

            const availableStats = feedItems.reduce(
                (acc, item) => {
                    acc.score += item.score || 0
                    acc.lives += item.life || 0
                    return acc
                },
                { score: 0, lives: 0 }
            )

            if (stat.score <= 5) {
                newFeeds = GamePlayUtils_3(1, 1)
            } else if (stat.score > 5 && stat.score <= 10) {
                newFeeds = GamePlayUtils_3(2, 2)
            } else if (stat.score > 10) {
                newFeeds = GamePlayUtils_3(3, 3)

                if (stat.lives >= 2) {
                    newFeeds.push(GamePlayUtils_3(1, 4)[0])
                }

                if (stat.lives < 3) {
                    newFeeds.push(GamePlayUtils_3(1, 5)[0])
                }
            }

            console.log('AVStat', stat, JSON.stringify(availableStats), newFeeds)
            return newFeeds
        }

        function isGameOver() {
            const head = shrimpPositions[0]

            if (
                head.x < 0 ||
                head.x >= 970 ||
                head.y < 0 ||
                head.y >= 690 ||
                shrimpPositions.slice(1).find((s) => GamePlayUtils_2(s, head)) ||
                stat.lives === 0
            ) {
                set_store_value(options, ($options.music = 'theEnd.mp3'), $options)
                $$invalidate(1, (gameOver = true))
                return true
            }
        }

        function onKeyDown(event) {
            const newDirection = GamePlayUtils_5(event.keyCode)

            if (newDirection && !GamePlayUtils_4(direction, newDirection)) {
                direction = newDirection

                if (!gameRunning) {
                    startGame()
                }
            }
        }

        function initialState() {
            clearInterval(intervalId)
            $$invalidate(2, (gameRunning = true))
            $$invalidate(1, (gameOver = false))
            set_store_value(options, ($options.music = 'theBeginning.mp3'), $options)
            $$invalidate(0, (stat = { score: 0, lives: 3 }))
            direction = 'right'
            $$invalidate(
                3,
                (shrimpPositions = [
                    { x: 50, y: 350 },
                    { x: 25, y: 350 },
                    { x: 0, y: 350 },
                ])
            )
            $$invalidate(4, (feedItems = GamePlayUtils_3(1, 1)))
        }

        const writable_props = ['stat']

        Object.keys($$props).forEach((key) => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$')
                console_1.warn(`<GamePlay> was created with unknown prop '${key}'`)
        })

        let { $$slots = {}, $$scope } = $$props
        validate_slots('GamePlay', $$slots, [])

        $$self.$set = ($$props) => {
            if ('stat' in $$props) $$invalidate(0, (stat = $$props.stat))
        }

        $$self.$capture_state = () => ({
            Shrimp,
            FeedItems,
            options,
            fade,
            fly,
            Icon,
            moveShrimp: GamePlayUtils_1,
            collision: GamePlayUtils_2,
            getNewFeedItems: GamePlayUtils_3,
            isReverse: GamePlayUtils_4,
            getKeyCodeDirection: GamePlayUtils_5,
            gameOver,
            gameRunning,
            intervalId,
            shrimpPositions,
            direction,
            feedItems,
            stat,
            startGame,
            generateNewFeedItems,
            isGameOver,
            onKeyDown,
            initialState,
            interval,
            $options,
        })

        $$self.$inject_state = ($$props) => {
            if ('gameOver' in $$props) $$invalidate(1, (gameOver = $$props.gameOver))
            if ('gameRunning' in $$props) $$invalidate(2, (gameRunning = $$props.gameRunning))
            if ('intervalId' in $$props) intervalId = $$props.intervalId
            if ('shrimpPositions' in $$props) $$invalidate(3, (shrimpPositions = $$props.shrimpPositions))
            if ('direction' in $$props) direction = $$props.direction
            if ('feedItems' in $$props) $$invalidate(4, (feedItems = $$props.feedItems))
            if ('stat' in $$props) $$invalidate(0, (stat = $$props.stat))
            if ('interval' in $$props) interval = $$props.interval
        }

        let interval

        if ($$props && '$$inject' in $$props) {
            $$self.$inject_state($$props.$$inject)
        }

        $$self.$$.update = () => {
            if ($$self.$$.dirty & /*$options*/ 1024) {
                interval = $options.advanced ? 80 : 180
            }
        }

        return [stat, gameOver, gameRunning, shrimpPositions, feedItems, startGame, onKeyDown]
    }

    class GamePlay extends SvelteComponentDev {
        constructor(options) {
            super(options)
            init(this, options, instance$3, create_fragment$3, safe_not_equal, { stat: 0 })

            dispatch_dev('SvelteRegisterComponent', {
                component: this,
                tagName: 'GamePlay',
                options,
                id: create_fragment$3.name,
            })

            const { ctx } = this.$$
            const props = options.props || {}

            if (/*stat*/ ctx[0] === undefined && !('stat' in props)) {
                console_1.warn("<GamePlay> was created without expected prop 'stat'")
            }
        }

        get stat() {
            throw new Error(
                "<GamePlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'"
            )
        }

        set stat(value) {
            throw new Error(
                "<GamePlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'"
            )
        }
    }

    /* src/svelte/components/Options.svelte generated by Svelte v3.22.3 */
    const file$4 = 'src/svelte/components/Options.svelte'

    function create_fragment$4(ctx) {
        let div0
        let button0
        let t1
        let button1
        let t3
        let button2
        let t5
        let div1
        let label0
        let input
        let t6
        let span
        let t7
        let label1
        let t8_value = /*$options*/ (ctx[4].advanced ? 'Advanced' : 'Easy') + ''
        let t8
        let t9
        let audio_1
        let source
        let source_src_value
        let t10
        let current
        let dispose

        const icon = new Icon({
            props: {
                style: 'margin-top: 15px;',
                iconName: /*soundIcon*/ ctx[3],
            },
            $$inline: true,
        })

        icon.$on('click', /*click_handler_4*/ ctx[11])

        const block = {
            c: function create() {
                div0 = element('div')
                button0 = element('button')
                button0.textContent = 'Koro Sea'
                t1 = space()
                button1 = element('button')
                button1.textContent = 'Coral Sea'
                t3 = space()
                button2 = element('button')
                button2.textContent = 'Red Sea'
                t5 = space()
                div1 = element('div')
                label0 = element('label')
                input = element('input')
                t6 = space()
                span = element('span')
                t7 = space()
                label1 = element('label')
                t8 = text(t8_value)
                t9 = space()
                audio_1 = element('audio')
                source = element('source')
                t10 = space()
                create_component(icon.$$.fragment)
                attr_dev(button0, 'class', 'svelte-zlvs8e')
                toggle_class(button0, 'active', /*$options*/ ctx[4].gameMap === '3HeadedMonster')
                add_location(button0, file$4, 22, 4, 524)
                attr_dev(button1, 'class', 'svelte-zlvs8e')
                toggle_class(button1, 'active', /*$options*/ ctx[4].gameMap === 'corals')
                add_location(button1, file$4, 23, 4, 662)
                attr_dev(button2, 'class', 'svelte-zlvs8e')
                toggle_class(button2, 'active', /*$options*/ ctx[4].gameMap === 'giantMonster')
                add_location(button2, file$4, 24, 4, 785)
                attr_dev(div0, 'class', 'tab svelte-zlvs8e')
                add_location(div0, file$4, 21, 0, 502)
                attr_dev(input, 'type', 'checkbox')
                attr_dev(input, 'class', 'svelte-zlvs8e')
                add_location(input, file$4, 30, 8, 979)
                attr_dev(span, 'class', 'slider svelte-zlvs8e')
                add_location(span, file$4, 31, 8, 1087)
                attr_dev(label0, 'class', 'switch svelte-zlvs8e')
                add_location(label0, file$4, 29, 4, 948)
                add_location(label1, file$4, 33, 4, 1133)
                attr_dev(div1, 'class', 'toggle svelte-zlvs8e')
                add_location(div1, file$4, 28, 0, 923)
                if (source.src !== (source_src_value = '')) attr_dev(source, 'src', source_src_value)
                attr_dev(source, 'type', '')
                add_location(source, file$4, 37, 4, 1250)
                audio_1.muted = /*muted*/ ctx[2]
                audio_1.autoplay = true
                audio_1.loop = true
                add_location(audio_1, file$4, 36, 0, 1198)
            },
            l: function claim(nodes) {
                throw new Error(
                    'options.hydrate only works if the component was compiled with the `hydratable: true` option'
                )
            },
            m: function mount(target, anchor, remount) {
                insert_dev(target, div0, anchor)
                append_dev(div0, button0)
                append_dev(div0, t1)
                append_dev(div0, button1)
                append_dev(div0, t3)
                append_dev(div0, button2)
                insert_dev(target, t5, anchor)
                insert_dev(target, div1, anchor)
                append_dev(div1, label0)
                append_dev(label0, input)
                append_dev(label0, t6)
                append_dev(label0, span)
                append_dev(div1, t7)
                append_dev(div1, label1)
                append_dev(label1, t8)
                insert_dev(target, t9, anchor)
                insert_dev(target, audio_1, anchor)
                append_dev(audio_1, source)
                /*source_binding*/ ctx[9](source)
                /*audio_1_binding*/ ctx[10](audio_1)
                insert_dev(target, t10, anchor)
                mount_component(icon, target, anchor)
                current = true
                if (remount) run_all(dispose)

                dispose = [
                    listen_dev(button0, 'click', /*click_handler*/ ctx[5], false, false, false),
                    listen_dev(button1, 'click', /*click_handler_1*/ ctx[6], false, false, false),
                    listen_dev(button2, 'click', /*click_handler_2*/ ctx[7], false, false, false),
                    listen_dev(input, 'click', /*click_handler_3*/ ctx[8], false, false, false),
                ]
            },
            p: function update(ctx, [dirty]) {
                if (dirty & /*$options*/ 16) {
                    toggle_class(button0, 'active', /*$options*/ ctx[4].gameMap === '3HeadedMonster')
                }

                if (dirty & /*$options*/ 16) {
                    toggle_class(button1, 'active', /*$options*/ ctx[4].gameMap === 'corals')
                }

                if (dirty & /*$options*/ 16) {
                    toggle_class(button2, 'active', /*$options*/ ctx[4].gameMap === 'giantMonster')
                }

                if (
                    (!current || dirty & /*$options*/ 16) &&
                    t8_value !== (t8_value = /*$options*/ (ctx[4].advanced ? 'Advanced' : 'Easy') + '')
                )
                    set_data_dev(t8, t8_value)

                if (!current || dirty & /*muted*/ 4) {
                    prop_dev(audio_1, 'muted', /*muted*/ ctx[2])
                }

                const icon_changes = {}
                if (dirty & /*soundIcon*/ 8) icon_changes.iconName = /*soundIcon*/ ctx[3]
                icon.$set(icon_changes)
            },
            i: function intro(local) {
                if (current) return
                transition_in(icon.$$.fragment, local)
                current = true
            },
            o: function outro(local) {
                transition_out(icon.$$.fragment, local)
                current = false
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div0)
                if (detaching) detach_dev(t5)
                if (detaching) detach_dev(div1)
                if (detaching) detach_dev(t9)
                if (detaching) detach_dev(audio_1)
                /*source_binding*/ ctx[9](null)
                /*audio_1_binding*/ ctx[10](null)
                if (detaching) detach_dev(t10)
                destroy_component(icon, detaching)
                run_all(dispose)
            },
        }

        dispatch_dev('SvelteRegisterBlock', {
            block,
            id: create_fragment$4.name,
            type: 'component',
            source: '',
            ctx,
        })

        return block
    }

    function instance$4($$self, $$props, $$invalidate) {
        let $options
        validate_store(options, 'options')
        component_subscribe($$self, options, ($$value) => $$invalidate(4, ($options = $$value)))
        let audio
        let audioSource
        let muted = false

        afterUpdate(() => {
            if ($options.music) {
                $$invalidate(1, (audioSource.src = `./${$options.music}`), audioSource)
                $$invalidate(1, (audioSource.type = `audio/${$options.music.split('.')[1]}`), audioSource)
                audio.load()
                audio.play()
            }
        })

        const writable_props = []

        Object.keys($$props).forEach((key) => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$')
                console.warn(`<Options> was created with unknown prop '${key}'`)
        })

        let { $$slots = {}, $$scope } = $$props
        validate_slots('Options', $$slots, [])
        const click_handler = () => set_store_value(options, ($options.gameMap = '3HeadedMonster'), $options)
        const click_handler_1 = () => set_store_value(options, ($options.gameMap = 'corals'), $options)
        const click_handler_2 = () => set_store_value(options, ($options.gameMap = 'giantMonster'), $options)

        const click_handler_3 = () =>
            set_store_value(
                options,
                ($options = {
                    ...$options,
                    advanced: !$options.advanced,
                })
            )

        function source_binding($$value) {
            binding_callbacks[$$value ? 'unshift' : 'push'](() => {
                $$invalidate(1, (audioSource = $$value))
            })
        }

        function audio_1_binding($$value) {
            binding_callbacks[$$value ? 'unshift' : 'push'](() => {
                $$invalidate(0, (audio = $$value))
            })
        }

        const click_handler_4 = () => $$invalidate(2, (muted = !muted))

        $$self.$capture_state = () => ({
            options,
            afterUpdate,
            Icon,
            audio,
            audioSource,
            muted,
            soundIcon,
            $options,
        })

        $$self.$inject_state = ($$props) => {
            if ('audio' in $$props) $$invalidate(0, (audio = $$props.audio))
            if ('audioSource' in $$props) $$invalidate(1, (audioSource = $$props.audioSource))
            if ('muted' in $$props) $$invalidate(2, (muted = $$props.muted))
            if ('soundIcon' in $$props) $$invalidate(3, (soundIcon = $$props.soundIcon))
        }

        let soundIcon

        if ($$props && '$$inject' in $$props) {
            $$self.$inject_state($$props.$$inject)
        }

        $$self.$$.update = () => {
            if ($$self.$$.dirty & /*muted*/ 4) {
                $$invalidate(3, (soundIcon = muted ? 'sound-muted' : 'sound-on'))
            }
        }

        return [
            audio,
            audioSource,
            muted,
            soundIcon,
            $options,
            click_handler,
            click_handler_1,
            click_handler_2,
            click_handler_3,
            source_binding,
            audio_1_binding,
            click_handler_4,
        ]
    }

    class Options extends SvelteComponentDev {
        constructor(options) {
            super(options)
            init(this, options, instance$4, create_fragment$4, safe_not_equal, {})

            dispatch_dev('SvelteRegisterComponent', {
                component: this,
                tagName: 'Options',
                options,
                id: create_fragment$4.name,
            })
        }
    }

    /* src/svelte/App.svelte generated by Svelte v3.22.3 */
    const file$5 = 'src/svelte/App.svelte'

    function get_each_context$2(ctx, list, i) {
        const child_ctx = ctx.slice()
        child_ctx[3] = list[i]
        return child_ctx
    }

    // (31:2) {#each Array(stat.lives) as i}
    function create_each_block$2(ctx) {
        let current

        const icon = new Icon({
            props: { iconName: 'gamepad' },
            $$inline: true,
        })

        const block = {
            c: function create() {
                create_component(icon.$$.fragment)
            },
            m: function mount(target, anchor) {
                mount_component(icon, target, anchor)
                current = true
            },
            p: noop,
            i: function intro(local) {
                if (current) return
                transition_in(icon.$$.fragment, local)
                current = true
            },
            o: function outro(local) {
                transition_out(icon.$$.fragment, local)
                current = false
            },
            d: function destroy(detaching) {
                destroy_component(icon, detaching)
            },
        }

        dispatch_dev('SvelteRegisterBlock', {
            block,
            id: create_each_block$2.name,
            type: 'each',
            source: '(31:2) {#each Array(stat.lives) as i}',
            ctx,
        })

        return block
    }

    function create_fragment$5(ctx) {
        let div2
        let h1
        let t1
        let main
        let updating_stat
        let t2
        let div1
        let h2
        let t3
        let t4_value = /*stat*/ ctx[0].score + ''
        let t4
        let t5
        let div0
        let t6
        let current

        function gameplay_stat_binding(value) {
            /*gameplay_stat_binding*/ ctx[2].call(null, value)
        }

        let gameplay_props = {}

        if (/*stat*/ ctx[0] !== void 0) {
            gameplay_props.stat = /*stat*/ ctx[0]
        }

        const gameplay = new GamePlay({ props: gameplay_props, $$inline: true })
        binding_callbacks.push(() => bind(gameplay, 'stat', gameplay_stat_binding))
        let each_value = Array(/*stat*/ ctx[0].lives)
        validate_each_argument(each_value)
        let each_blocks = []

        for (let i = 0; i < each_value.length; i += 1) {
            each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i))
        }

        const out = (i) =>
            transition_out(each_blocks[i], 1, 1, () => {
                each_blocks[i] = null
            })

        const options_1 = new Options({ $$inline: true })

        const block = {
            c: function create() {
                div2 = element('div')
                h1 = element('h1')
                h1.textContent = 'Hungry Shrimp'
                t1 = space()
                main = element('main')
                create_component(gameplay.$$.fragment)
                t2 = space()
                div1 = element('div')
                h2 = element('h2')
                t3 = text('Score ')
                t4 = text(t4_value)
                t5 = space()
                div0 = element('div')

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].c()
                }

                t6 = space()
                create_component(options_1.$$.fragment)
                attr_dev(h1, 'class', 'svelte-hz2rr')
                add_location(h1, file$5, 21, 1, 365)
                set_style(main, 'background-image', "url('./" + /*$options*/ ctx[1].gameMap + ".jpg')")
                attr_dev(main, 'class', 'svelte-hz2rr')
                add_location(main, file$5, 23, 1, 390)
                attr_dev(h2, 'class', 'svelte-hz2rr')
                add_location(h2, file$5, 28, 2, 522)
                set_style(div0, 'display', 'block')
                set_style(div0, 'margin', '6px')
                add_location(div0, file$5, 29, 2, 552)
                attr_dev(div1, 'class', 'control-panel svelte-hz2rr')
                add_location(div1, file$5, 27, 1, 492)
                attr_dev(div2, 'class', 'container svelte-hz2rr')
                add_location(div2, file$5, 20, 0, 340)
            },
            l: function claim(nodes) {
                throw new Error(
                    'options.hydrate only works if the component was compiled with the `hydratable: true` option'
                )
            },
            m: function mount(target, anchor) {
                insert_dev(target, div2, anchor)
                append_dev(div2, h1)
                append_dev(div2, t1)
                append_dev(div2, main)
                mount_component(gameplay, main, null)
                append_dev(div2, t2)
                append_dev(div2, div1)
                append_dev(div1, h2)
                append_dev(h2, t3)
                append_dev(h2, t4)
                append_dev(div1, t5)
                append_dev(div1, div0)

                for (let i = 0; i < each_blocks.length; i += 1) {
                    each_blocks[i].m(div0, null)
                }

                append_dev(div1, t6)
                mount_component(options_1, div1, null)
                current = true
            },
            p: function update(ctx, [dirty]) {
                const gameplay_changes = {}

                if (!updating_stat && dirty & /*stat*/ 1) {
                    updating_stat = true
                    gameplay_changes.stat = /*stat*/ ctx[0]
                    add_flush_callback(() => (updating_stat = false))
                }

                gameplay.$set(gameplay_changes)

                if (!current || dirty & /*$options*/ 2) {
                    set_style(main, 'background-image', "url('./" + /*$options*/ ctx[1].gameMap + ".jpg')")
                }

                if ((!current || dirty & /*stat*/ 1) && t4_value !== (t4_value = /*stat*/ ctx[0].score + ''))
                    set_data_dev(t4, t4_value)

                if (dirty & /*stat*/ 1) {
                    each_value = Array(/*stat*/ ctx[0].lives)
                    validate_each_argument(each_value)
                    let i

                    for (i = 0; i < each_value.length; i += 1) {
                        const child_ctx = get_each_context$2(ctx, each_value, i)

                        if (each_blocks[i]) {
                            each_blocks[i].p(child_ctx, dirty)
                            transition_in(each_blocks[i], 1)
                        } else {
                            each_blocks[i] = create_each_block$2(child_ctx)
                            each_blocks[i].c()
                            transition_in(each_blocks[i], 1)
                            each_blocks[i].m(div0, null)
                        }
                    }

                    group_outros()

                    for (i = each_value.length; i < each_blocks.length; i += 1) {
                        out(i)
                    }

                    check_outros()
                }
            },
            i: function intro(local) {
                if (current) return
                transition_in(gameplay.$$.fragment, local)

                for (let i = 0; i < each_value.length; i += 1) {
                    transition_in(each_blocks[i])
                }

                transition_in(options_1.$$.fragment, local)
                current = true
            },
            o: function outro(local) {
                transition_out(gameplay.$$.fragment, local)
                each_blocks = each_blocks.filter(Boolean)

                for (let i = 0; i < each_blocks.length; i += 1) {
                    transition_out(each_blocks[i])
                }

                transition_out(options_1.$$.fragment, local)
                current = false
            },
            d: function destroy(detaching) {
                if (detaching) detach_dev(div2)
                destroy_component(gameplay)
                destroy_each(each_blocks, detaching)
                destroy_component(options_1)
            },
        }

        dispatch_dev('SvelteRegisterBlock', {
            block,
            id: create_fragment$5.name,
            type: 'component',
            source: '',
            ctx,
        })

        return block
    }

    function instance$5($$self, $$props, $$invalidate) {
        let $options
        validate_store(options, 'options')
        component_subscribe($$self, options, ($$value) => $$invalidate(1, ($options = $$value)))
        let stat = { score: 0, lives: 3 }
        const writable_props = []

        Object.keys($$props).forEach((key) => {
            if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$')
                console.warn(`<App> was created with unknown prop '${key}'`)
        })

        let { $$slots = {}, $$scope } = $$props
        validate_slots('App', $$slots, [])

        function gameplay_stat_binding(value) {
            stat = value
            $$invalidate(0, stat)
        }

        $$self.$capture_state = () => ({
            GamePlay,
            Options,
            options,
            Icon,
            stat,
            $options,
        })

        $$self.$inject_state = ($$props) => {
            if ('stat' in $$props) $$invalidate(0, (stat = $$props.stat))
        }

        if ($$props && '$$inject' in $$props) {
            $$self.$inject_state($$props.$$inject)
        }

        return [stat, $options, gameplay_stat_binding]
    }

    class App extends SvelteComponentDev {
        constructor(options) {
            super(options)
            init(this, options, instance$5, create_fragment$5, safe_not_equal, {})

            dispatch_dev('SvelteRegisterComponent', {
                component: this,
                tagName: 'App',
                options,
                id: create_fragment$5.name,
            })
        }
    }

    const app = new App({
        target: document.body,
    })

    return app
})()
//# sourceMappingURL=bundle.js.map
