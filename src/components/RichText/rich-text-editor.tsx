"use client"
import React from 'react';
import { createEditor, Descendant, Editor, Element as SlateElement, Transforms, Text, Range } from 'slate';
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { Bold, Italic, Underline, Code, Heading1, Heading2, List, ListOrdered } from 'lucide-react';
import { motion } from 'framer-motion';

// Define custom types for TypeScript
// Use discriminated union for CustomElement

type ParagraphElement = { type: 'paragraph'; children: CustomText[] };
type HeadingOneElement = { type: 'heading-one'; children: CustomText[] };
type HeadingTwoElement = { type: 'heading-two'; children: CustomText[] };
type BulletedListElement = { type: 'bulleted-list'; children: CustomText[] };
type NumberedListElement = { type: 'numbered-list'; children: CustomText[] };
type ListItemElement = { type: 'list-item'; children: CustomText[] };

type CustomElement =
  | ParagraphElement
  | HeadingOneElement
  | HeadingTwoElement
  | BulletedListElement
  | NumberedListElement
  | ListItemElement;

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: Editor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Define props for the RichTextEditor component
interface RichTextEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
}

// Helper to check if the current selection has a mark
const isMarkActive = (editor: Editor, format: keyof Omit<CustomText, 'text'>) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

// Helper to toggle a mark
const toggleMark = (editor: Editor, format: keyof Omit<CustomText, 'text'>) => {
  const isActive = isMarkActive(editor, format);
  
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

// Helper to check if block type is active
const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
  });
  
  return !!match;
};

// Helper to toggle block type
const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = format === 'bulleted-list' || format === 'numbered-list';
  
  Transforms.unwrapNodes(editor, {
    match: n => 
      !Editor.isEditor(n) && 
      SlateElement.isElement(n) && 
      ['bulleted-list', 'numbered-list'].includes(n.type),
    split: true,
  });
  
  const newProperties: Partial<SlateElement> = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  };
  
  Transforms.setNodes(editor, newProperties);
  
  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

// Convert HTML to Slate nodes
const deserialize = (html: string): Descendant[] => {
  if (!html) return [{ type: 'paragraph', children: [{ text: '' }] }];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const convertDomNode = (node: Node): any => {
    if (node.nodeType === 3) {
      return { text: node.textContent || '' };
    } else if (node.nodeType !== 1) {
      return null;
    }
    
    const element = node as HTMLElement;
    const children = Array.from(node.childNodes)
      .map(convertDomNode)
      .flat()
      .filter(Boolean);
    
    if (children.length === 0) {
      children.push({ text: '' });
    }
    
    switch (element.nodeName.toLowerCase()) {
      case 'body':
        return children;
      case 'br':
        return { text: '\n' };
      case 'p':
        return { type: 'paragraph', children };
      case 'h1':
        return { type: 'heading-one', children };
      case 'h2':
        return { type: 'heading-two', children };
      case 'ul':
        return { type: 'bulleted-list', children };
      case 'ol':
        return { type: 'numbered-list', children };
      case 'li':
        return { type: 'list-item', children };
      case 'strong':
      case 'b':
        return children.map(child => ({ ...child, bold: true }));
      case 'em':
      case 'i':
        return children.map(child => ({ ...child, italic: true }));
      case 'u':
        return children.map(child => ({ ...child, underline: true }));
      case 'code':
        return children.map(child => ({ ...child, code: true }));
      default:
        return children;
    }
  };
  
  const result = convertDomNode(doc.body);
  return result.length ? result : [{ type: 'paragraph', children: [{ text: '' }] }];
};

// Convert Slate nodes to HTML
const serialize = (nodes: Descendant[]): string => {
  return nodes.map(node => {
    if (Text.isText(node)) {
      let string = node.text;
      
      if (node.bold) {
        string = `<strong>${string}</strong>`;
      }
      if (node.italic) {
        string = `<em>${string}</em>`;
      }
      if (node.underline) {
        string = `<u>${string}</u>`;
      }
      if (node.code) {
        string = `<code>${string}</code>`;
      }
      
      return string;
    }
    
    // Type guard for CustomElement
    if (!('type' in node)) return '';
    const element = node as CustomElement;
    const children = element.children.map(n => serialize([n])).join('');
    
    switch (element.type) {
      case 'paragraph':
        return `<p>${children}</p>`;
      case 'heading-one':
        return `<h1>${children}</h1>`;
      case 'heading-two':
        return `<h2>${children}</h2>`;
      case 'bulleted-list':
        return `<ul>${children}</ul>`;
      case 'numbered-list':
        return `<ol>${children}</ol>`;
      case 'list-item':
        return `<li>${children}</li>`;
      default:
        return children;
    }
  }).join('');
};

// Toolbar button component
const ToolbarButton = ({ 
  icon, 
  tooltip, 
  active = false, 
  onPress 
}: { 
  icon: React.ReactNode; 
  tooltip: string; 
  active?: boolean; 
  onPress: () => void; 
}) => {
  return (
    <button
      type="button"
      className={`min-w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-150 border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 ${active ? 'bg-primary text-primary-foreground' : 'bg-white hover:bg-gray-100 text-gray-700'}`}
      onClick={onPress}
      title={tooltip}
      aria-label={tooltip}
    >
      {icon}
    </button>
  );
};

// Main RichTextEditor component
export const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialValue = '', onChange }) => {
  // Create a Slate editor object that won't change across renders
  const editor = React.useMemo(() => withHistory(withReact(createEditor())), []);
  
  // Parse the initial HTML value into Slate's format
  const initialValueAsNodes = React.useMemo(() => {
    return deserialize(initialValue);
  }, [initialValue]);
  
  // Keep track of the editor's value
  const [value, setValue] = React.useState<Descendant[]>(initialValueAsNodes);
  
  // Update the external onChange handler when the editor value changes
  React.useEffect(() => {
    if (onChange) {
      const html = serialize(value);
      onChange(html);
    }
  }, [value, onChange]);
  
  // Define a rendering function for elements
  const renderElement = React.useCallback((props: RenderElementProps) => {
    // Type guard for CustomElement
    const element = props.element as CustomElement;
    switch (element.type) {
      case 'heading-one':
        return <h1 {...props.attributes} className="text-2xl font-semibold my-2">{props.children}</h1>;
      case 'heading-two':
        return <h2 {...props.attributes} className="text-xl font-semibold my-2">{props.children}</h2>;
      case 'bulleted-list':
        return <ul {...props.attributes} className="list-disc pl-10 my-2">{props.children}</ul>;
      case 'numbered-list':
        return <ol {...props.attributes} className="list-decimal pl-10 my-2">{props.children}</ol>;
      case 'list-item':
        return <li {...props.attributes}>{props.children}</li>;
      default:
        return <p {...props.attributes} className="my-2">{props.children}</p>;
    }
  }, []);
  
  // Define a rendering function for leaves (text formatting)
  const renderLeaf = React.useCallback((props: RenderLeafProps) => {
    let { children } = props;
    
    if (props.leaf.bold) {
      children = <strong>{children}</strong>;
    }
    
    if (props.leaf.italic) {
      children = <em>{children}</em>;
    }
    
    if (props.leaf.underline) {
      children = <u>{children}</u>;
    }
    
    if (props.leaf.code) {
      children = <code className="bg-content2 px-1 py-0.5 rounded text-sm">{children}</code>;
    }
    
    return <span {...props.attributes}>{children}</span>;
  }, []);
  
  return (
    <div className="border-none">
      <motion.div 
        className="bg-content1 border-b border-default-100 p-2 flex flex-wrap gap-1 items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ToolbarButton
          icon={<Bold size={18} />}
          tooltip="Bold"
          active={isMarkActive(editor, 'bold')}
          onPress={() => toggleMark(editor, 'bold')}
        />
        <ToolbarButton
          icon={<Italic size={18} />}
          tooltip="Italic"
          active={isMarkActive(editor, 'italic')}
          onPress={() => toggleMark(editor, 'italic')}
        />
        <ToolbarButton
          icon={<Underline size={18} />}
          tooltip="Underline"
          active={isMarkActive(editor, 'underline')}
          onPress={() => toggleMark(editor, 'underline')}
        />
        <ToolbarButton
          icon={<Code size={18} />}
          tooltip="Code"
          active={isMarkActive(editor, 'code')}
          onPress={() => toggleMark(editor, 'code')}
        />
        
        <div className="w-px h-8 bg-gray-200 mx-1" />
        
        <ToolbarButton
          icon={<Heading1 size={18} />}
          tooltip="Heading 1"
          active={isBlockActive(editor, 'heading-one')}
          onPress={() => toggleBlock(editor, 'heading-one')}
        />
        <ToolbarButton
          icon={<Heading2 size={18} />}
          tooltip="Heading 2"
          active={isBlockActive(editor, 'heading-two')}
          onPress={() => toggleBlock(editor, 'heading-two')}
        />
        
        <div className="w-px h-8 bg-gray-200 mx-1" />
        
        <ToolbarButton
          icon={<List size={18} />}
          tooltip="Bulleted List"
          active={isBlockActive(editor, 'bulleted-list')}
          onPress={() => toggleBlock(editor, 'bulleted-list')}
        />
        <ToolbarButton
          icon={<ListOrdered size={18} />}
          tooltip="Numbered List"
          active={isBlockActive(editor, 'numbered-list')}
          onPress={() => toggleBlock(editor, 'numbered-list')}
        />
      </motion.div>
      
      <div className="p-6">
        <Slate
          editor={editor}
          initialValue={initialValueAsNodes}
          onChange={value => setValue(value)}
        >
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder="Start typing..."
            spellCheck
            autoFocus
            className="min-h-[200px] outline-none"
          />
        </Slate>
      </div>
    </div>
  );
};