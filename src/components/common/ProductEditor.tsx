"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import YooptaEditor, { createYooptaEditor, YooptaContentValue, YooptaOnChangeOptions, YooptaPlugin } from '@yoopta/editor'
import Paragraph from '@yoopta/paragraph'
import Blockquote from '@yoopta/blockquote'
import Embed from '@yoopta/embed'
import Image from '@yoopta/image'
import Link from '@yoopta/link'
import Callout from '@yoopta/callout'
import Video from '@yoopta/video'
import File from '@yoopta/file'
import Accordion from '@yoopta/accordion'
import { NumberedList, BulletedList, TodoList } from '@yoopta/lists'
import { Bold, Italic, CodeMark, Underline, Strike, Highlight } from '@yoopta/marks'
import { HeadingOne, HeadingTwo, HeadingThree } from '@yoopta/headings'
import Code from '@yoopta/code'
import Table from '@yoopta/table'
import Divider from '@yoopta/divider'
import ActionMenuList, { DefaultActionMenuRender } from '@yoopta/action-menu-list'
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar'
import LinkTool, { DefaultLinkToolRender } from '@yoopta/link-tool'
import _ from "lodash"

interface ProductEditorProps {
  initialContent?: any
  onChange?: (content: any) => void
  readOnly?: boolean
  className?: string
}

const DEFAULT_CONTENT = {
  "6d94f0e1-8ed1-463a-83e9-368b3280e4c0": {
    "id": "6d94f0e1-8ed1-463a-83e9-368b3280e4c0",
    "type": "Paragraph",
    "value": [
      {
        "id": "5af5f301-8943-4b2d-8c17-9e1e52c8a07d",
        "type": "paragraph",
        "children": [
          {
            "text": ""
          }
        ]
      }
    ],
    "meta": {
      "align": "left",
      "depth": 0,
      "order": 0
    }
  },
  "4452b564-64b9-4d79-a925-8228d9b35b7d": {
    "id": "4452b564-64b9-4d79-a925-8228d9b35b7d",
    "type": "Paragraph",
    "value": [
      {
        "id": "cfa7a55e-1f03-472a-818e-0198cb84337d",
        "type": "paragraph",
        "children": [
          {
            "text": ""
          }
        ]
      }
    ],
    "meta": {
      "align": "left",
      "depth": 0,
      "order": 1
    }
  }
}

const plugins = [
  Paragraph,
  Table,
  Divider,
  Accordion,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  Blockquote,
  Callout,
  NumberedList,
  BulletedList,
  TodoList,
  Code,
  Link,
  Embed,
  Image,
  Video,
  File,
] as readonly YooptaPlugin<any, any>[]

const TOOLS = {
  ActionMenu: {
    render: DefaultActionMenuRender,
    tool: ActionMenuList,
  },
  Toolbar: {
    render: DefaultToolbarRender,
    tool: Toolbar,
  },
  LinkTool: {
    render: DefaultLinkToolRender,
    tool: LinkTool,
  },
}

const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight]

const ProductEditor: React.FC<ProductEditorProps> = ({ initialContent, onChange, readOnly = false, className }) => {
  const editor = useMemo(() => createYooptaEditor(), [])
  const selectionRef = useRef(null)
  
  // Initialize state with a proper initial value
  const [value, setValue] = useState(() => {
    try {
      // If initialContent is provided and valid, use it
      if (initialContent) {
        // Handle string or object format
        const contentValue = typeof initialContent === 'string' 
          ? JSON.parse(initialContent) 
          : initialContent;
          
        // Check if it's a valid object (not empty and not an array)
        if (contentValue && typeof contentValue === 'object' && !Array.isArray(contentValue) && !_.isEmpty(contentValue)) {
          return contentValue;
        }
      }
    } catch (error) {
      console.error("Error parsing initial content:", error);
    }
    
    // Fall back to default content
    return DEFAULT_CONTENT;
  });

  // Update value when initialContent changes (for dynamic updates)
  useEffect(() => {
    if (initialContent) {
      try {
        const contentValue = typeof initialContent === 'string' 
          ? JSON.parse(initialContent) 
          : initialContent;
          
        if (contentValue && typeof contentValue === 'object' && !Array.isArray(contentValue) && !_.isEmpty(contentValue)) {
          setValue(contentValue);
          return;
        }
      } catch (error) {
        console.error("Error handling updated initial content:", error);
      }
    } else if (_.isEmpty(initialContent)) {
      // If initialContent is explicitly empty (not undefined), reset to default
      setValue(DEFAULT_CONTENT);
    }
  }, [initialContent]);

  const handleChange = (newValue: YooptaContentValue, options: YooptaOnChangeOptions) => {
    if (readOnly) return;
    setValue(newValue);
    onChange?.(newValue);
  }

  return (
    <div className="w-full flex justify-center">
      <div className={"border rounded-lg p-4 shadow-sm w-full " + className} ref={selectionRef}>
        <YooptaEditor
          editor={editor}
          plugins={plugins}
          marks={MARKS}
          tools={TOOLS}
          value={value}
          onChange={handleChange}
          placeholder={readOnly ? "" : "Type / to open the menu..."}
          className="min-h-[200px] "
          width={"100%"}
          autoFocus={!readOnly}
          selectionBoxRoot={selectionRef}
          readOnly={readOnly}
        />
      </div>
    </div>
  )
}

export default ProductEditor