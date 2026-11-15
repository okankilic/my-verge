import React from 'react';
import { MessageKey, Vars, t } from './index';

// Like t(), but {name} placeholders found in `nodes` become React nodes (e.g. an inline icon),
// so each language can put them where its word order needs them.
export function tRich(key: MessageKey, nodes: Record<string, React.ReactNode>, vars?: Vars): React.ReactNode {
  const text = t(key, vars);
  const parts = text.split(/(\{\w+\})/g);
  return parts.map((part, i) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return <React.Fragment key={i}>{name && name in nodes ? nodes[name] : part}</React.Fragment>;
  });
}
