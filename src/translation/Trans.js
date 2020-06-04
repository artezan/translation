import React from 'react'
import {useTranslation} from './useTranslation'
import HTML from 'html-parse-stringify2'

export const Trans = ({children, translateKey}) => {
  const {t} = useTranslation()
  const { interpolation} = nodesToString(children)
  return RenderNodes(children, t(translateKey), interpolation)
}

function nodesToString(children) {
  if (!children) return ''
  // do not use `React.Children.toArray`, will fail at object children
  const childrenArray = getAsArray(children)
  const keepArray = ['br', 'strong']
  // e.g. lorem <br/> ipsum {{ messageCount, format }} dolor <strong>bold</strong> amet
  const res = childrenArray.reduce(
    ({stringNode, interpolation}, child, childIndex) => {
      if (typeof child === 'string') {
        // actual e.g. lorem
        // expected e.g. lorem
        stringNode += `${child}`
      } else if (React.isValidElement(child)) {
        const childPropsCount = Object.keys(child.props).length
        const shouldKeepChild = keepArray.indexOf(child.type) > -1
        const childChildren = child.props.children

        if (!childChildren && shouldKeepChild && childPropsCount === 0) {
          // actual e.g. lorem <br/> ipsum
          // expected e.g. lorem <br/> ipsum
          stringNode += `<${child.type}/>`
        } else if (
          !childChildren &&
          (!shouldKeepChild || childPropsCount !== 0)
        ) {
          // actual e.g. lorem <hr className="test" /> ipsum
          // expected e.g. lorem <0></0> ipsum
          stringNode += `<${childIndex}></${childIndex}>`
        } else if (
          shouldKeepChild &&
          childPropsCount === 1 &&
          typeof childChildren === 'string'
        ) {
          // actual e.g. dolor <strong>bold</strong> amet
          // expected e.g. dolor <strong>bold</strong> amet
          stringNode += `<${child.type}>${childChildren}</${child.type}>`
        } else {
          // regular case mapping the inner children
          const {stringNode: content, interpolation: int} = nodesToString(
            childChildren
          )
          interpolation = {...int, ...interpolation}
          stringNode += `<${childIndex}>${content}</${childIndex}>`
        }
      } else if (typeof child === 'object') {
        // e.g. lorem {{ value, format }} ipsum
        const keys = Object.keys(child)
        if (keys.length === 1) {
          const value = keys[0]
          interpolation = {...interpolation, ...child}

          stringNode += `{{${value}}}`
        } else {
          // not a valid interpolation object (can only contain one value plus format)
          console.log(
            `the passed in object contained more than one variable - the object should look like {{value}}`,
            child
          )
        }
      } else {
        console.log(
          `Trans: the passed in value is invalid - seems you passed in a variable like {number} - please pass in variables for interpolation as full objects like {{number}}.`,
          child
        )
      }
      return {stringNode, interpolation}
    },
    {
      stringNode: '',
      interpolation: {}
    }
  )

  return res
}
 function RenderNodes(children, targetString, interpolation) {
  if (targetString === '') return []

  // check if contains tags we need to replace from html string to react nodes
  const keepArray = ['br']
  const emptyChildrenButNeedsHandling =
    targetString && new RegExp(keepArray.join('|')).test(targetString)

  // no need to replace tags in the targetstring
  if (!children && !emptyChildrenButNeedsHandling) return [targetString]

  // v2 -> interpolates upfront no need for "some <0>{{var}}</0>"" -> will be just "some {{var}}" in translation file
  const data = {}

  function getData(childs) {
    const childrenArray = getAsArray(childs)

    childrenArray.forEach((child) => {
      if (typeof child === 'string') return
      if (hasChildren(child)) getData(getChildren(child))
      else if (typeof child === 'object' && !React.isValidElement(child))
        Object.assign(data, child)
    })
  }

  getData(children)

  const interpolatedString = (str, result) => {
    return str.replace(/{{(.+?)}}/g, (_, g1) => result[g1] || g1)
  }

  // parse ast from string with additional wrapper tag
  // -> avoids issues in parser removing prepending text nodes
  const ast = HTML.parse(
    `<0>${interpolatedString(targetString, interpolation)}</0>`
  )

  function mapAST(reactNode, astNode) {
    const reactNodes = getAsArray(reactNode)
    const astNodes = getAsArray(astNode)

    return astNodes.reduce((mem, node, i) => {
      const translationContent =
        node.children && node.children[0] && node.children[0].content
      if (node.type === 'tag') {
        const tmp = reactNodes[parseInt(node.name, 10)] || {}
        const child =
          Object.keys(node.attrs).length !== 0
            ? mergeProps({props: node.attrs}, tmp)
            : tmp

        const isElement = React.isValidElement(child)

        if (typeof child === 'string') {
          mem.push(child)
        } else if (hasChildren(child)) {
          const childs = getChildren(child)
          const mappedChildren = mapAST(childs, node.children)
          const inner =
            hasValidReactChildren(childs) && mappedChildren.length === 0
              ? childs
              : mappedChildren

          if (child.dummy) child.children = inner // needed on preact!
          mem.push(React.cloneElement(child, {...child.props, key: i}, inner))
        } else if (
          emptyChildrenButNeedsHandling &&
          typeof child === 'object' &&
          child.dummy &&
          !isElement
        ) {
          // we have a empty Trans node (the dummy element) with a targetstring that contains html tags needing
          // conversion to react nodes
          // so we just need to map the inner stuff
          const inner = mapAST(
            reactNodes /* wrong but we need something */,
            node.children
          )
          mem.push(React.cloneElement(child, {...child.props, key: i}, inner))
        } else if (Number.isNaN(parseFloat(node.name))) {
          if (keepArray.indexOf(node.name) > -1) {
            if (node.voidElement) {
              mem.push(
                React.createElement(node.name, {key: `${node.name}-${i}`})
              )
            } else {
              const inner = mapAST(
                reactNodes /* wrong but we need something */,
                node.children
              )

              mem.push(
                React.createElement(
                  node.name,
                  {key: `${node.name}-${i}`},
                  inner
                )
              )
            }
          } else if (node.voidElement) {
            mem.push(`<${node.name} />`)
          } else {
            const inner = mapAST(
              reactNodes /* wrong but we need something */,
              node.children
            )

            mem.push(`<${node.name}>${inner}</${node.name}>`)
          }
        } else if (typeof child === 'object' && !isElement) {
          const content = node.children[0] ? translationContent : null

          // v1
          // as interpolation was done already we just have a regular content node
          // in the translation AST while having an object in reactNodes
          // -> push the content no need to interpolate again
          if (content) mem.push(content)
        } else if (node.children.length === 1 && translationContent) {
          // If component does not have children, but translation - has
          // with this in component could be components={[<span class='make-beautiful'/>]} and in translation - 'some text <0>some highlighted message</0>'
          mem.push(
            React.cloneElement(
              child,
              {...child.props, key: i},
              translationContent
            )
          )
        } else {
          mem.push(React.cloneElement(child, {...child.props, key: i}))
        }
      } else if (node.type === 'text') {
        mem.push(node.content)
      }
      return mem
    }, [])
  }

  // call mapAST with having react nodes nested into additional node like
  // we did for the string ast from translation
  // return the children of that extra node to get expected result
  const result = mapAST([{dummy: true, children}], ast)
  return getChildren(result[0])
}

function hasChildren(node) {
  return node && (node.children || (node.props && node.props.children))
}

function getChildren(node) {
  if (!node) return []
  return node && node.children
    ? node.children
    : node.props && node.props.children
}

function hasValidReactChildren(children) {
  if (Object.prototype.toString.call(children) !== '[object Array]')
    return false
  return children.every((child) => React.isValidElement(child))
}

 function getAsArray(data) {
  return Array.isArray(data) ? data : [data]
}

function mergeProps(source, target) {
  const newTarget = {...target}
  // overwrite source.props when target.props already set
  newTarget.props = Object.assign(source.props, target.props)
  return newTarget
}
