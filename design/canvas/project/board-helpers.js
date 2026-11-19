// The helpers that a board shares. A board is one file and the bundle holds only the controls,
// so this script is their one home. A board loads it after the bundle and reads window.KinScapeBoard.
(() => {
  const camel = name => name.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
  // The drawn parts keep their CSS text. This turns it into the style object that React takes.
  const css = text => Object.fromEntries(text.split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const at = part.indexOf(':');
    return [camel(part.slice(0, at).trim()), part.slice(at + 1).trim()];
  }));
  const BOOLEAN = { checked: 'defaultChecked', disabled: 'disabled', readonly: 'readOnly' };
  const RENAME = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex' };
  // The exporter reads a named prop only from renderVals, and it throws on an <svg> child. So the drawn
  // parts of a slot are markup strings, and this turns one into React elements: an <x-import> is its component.
  const mount = html => {
    const h = window.React.createElement;
    const box = document.createElement('template');
    box.innerHTML = html;
    const build = (node, key) => {
      if (node.nodeType === 3) return node.nodeValue;
      if (node.nodeType !== 1) return null;

      const tag = node.localName;
      const props = { key };

      for (const { name, value } of Array.from(node.attributes)) {
        if (name === 'component-from-global-scope') continue;
        if (name === 'style') props.style = css(value);
        else if (tag !== 'x-import' && name in BOOLEAN) props[BOOLEAN[name]] = true;
        else if (tag !== 'x-import' && name in RENAME) props[RENAME[name]] = value;
        else if (tag !== 'x-import' && name === 'value' && /^(input|select|textarea)$/.test(tag)) props.defaultValue = value;
        else props[/^(aria|data)-/.test(name) ? name : camel(name)] = value;
      }

      const path = node.getAttribute('component-from-global-scope');
      const type = tag === 'x-import' ? path.split('.').reduce((part, name) => part && part[name], window) : tag;

      // React names no component when it gets none, so this names the one that the bundle lacks.
      if (!type) throw new Error(`No component ${path}`);

      return h(type, props, ...Array.from(node.childNodes, build));
    };

    return h(window.React.Fragment, null, ...Array.from(box.content.childNodes, build));
  };
  // The exporter throws on an <svg> child, so a drawn <svg> is a string that this mounts as it is.
  const drawn = html => window.React.createElement('div', { style: { display: 'contents' }, dangerouslySetInnerHTML: { __html: html } });

  window.KinScapeBoard = { drawn, mount };
})();
