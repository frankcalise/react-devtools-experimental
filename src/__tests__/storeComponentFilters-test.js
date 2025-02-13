// @flow

describe('Store component filters', () => {
  let React;
  let ReactDOM;
  let TestUtils;
  let Types;
  let store;
  let utils;

  const act = (callback: Function) => {
    TestUtils.act(() => {
      callback();
    });
    jest.runAllTimers(); // Flush Bridge operations
  };

  beforeEach(() => {
    store = global.store;
    store.collapseNodesByDefault = false;
    store.componentFilters = [];

    React = require('react');
    ReactDOM = require('react-dom');
    TestUtils = require('react-dom/test-utils');
    Types = require('src/types');
    utils = require('./utils');
  });

  it('should throw if filters are updated while profiling', () => {
    act(() => store.startProfiling());
    expect(() => (store.componentFilters = [])).toThrow(
      'Cannot modify filter preferences while profiling'
    );
  });

  it('should support filtering by element type', () => {
    class Root extends React.Component<{| children: React$Node |}> {
      render() {
        return <div>{this.props.children}</div>;
      }
    }
    const Component = () => <div>Hi</div>;

    act(() =>
      ReactDOM.render(
        <Root>
          <Component />
        </Root>,
        document.createElement('div')
      )
    );
    expect(store).toMatchSnapshot('1: mount');

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeHostComponent),
        ])
    );

    expect(store).toMatchSnapshot('2: hide host components');

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeClass),
        ])
    );

    expect(store).toMatchSnapshot('3: hide class components');

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeClass),
          utils.createElementTypeFilter(Types.ElementTypeFunction),
        ])
    );

    expect(store).toMatchSnapshot('4: hide class and function components');

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeClass, false),
          utils.createElementTypeFilter(Types.ElementTypeFunction, false),
        ])
    );

    expect(store).toMatchSnapshot('5: disable all filters');
  });

  it('should ignore invalid ElementTypeRoot filter', () => {
    const Root = () => <div>Hi</div>;

    act(() => ReactDOM.render(<Root />, document.createElement('div')));
    expect(store).toMatchSnapshot('1: mount');

    act(
      () =>
        (store.componentFilters = [
          utils.createElementTypeFilter(Types.ElementTypeRoot),
        ])
    );

    expect(store).toMatchSnapshot('2: add invalid filter');
  });

  it('should filter by display name', () => {
    const Text = ({ label }) => label;
    const Foo = () => <Text label="foo" />;
    const Bar = () => <Text label="bar" />;
    const Baz = () => <Text label="baz" />;

    act(() =>
      ReactDOM.render(
        <React.Fragment>
          <Foo />
          <Bar />
          <Baz />
        </React.Fragment>,
        document.createElement('div')
      )
    );
    expect(store).toMatchSnapshot('1: mount');

    act(
      () => (store.componentFilters = [utils.createDisplayNameFilter('Foo')])
    );
    expect(store).toMatchSnapshot('2: filter "Foo"');

    act(() => (store.componentFilters = [utils.createDisplayNameFilter('Ba')]));
    expect(store).toMatchSnapshot('3: filter "Ba"');

    act(
      () => (store.componentFilters = [utils.createDisplayNameFilter('B.z')])
    );
    expect(store).toMatchSnapshot('4: filter "B.z"');
  });

  it('should filter by path', () => {
    const Component = () => <div>Hi</div>;

    act(() => ReactDOM.render(<Component />, document.createElement('div')));
    expect(store).toMatchSnapshot('1: mount');

    act(
      () =>
        (store.componentFilters = [
          utils.createLocationFilter(__filename.replace(__dirname, '')),
        ])
    );

    expect(store).toMatchSnapshot(
      '2: hide all components declared within this test filed'
    );

    act(
      () =>
        (store.componentFilters = [
          utils.createLocationFilter('this:is:a:made:up:path'),
        ])
    );

    expect(store).toMatchSnapshot('3: hide components in a made up fake path');
  });
});
