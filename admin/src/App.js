import React, { Component } from 'react';
import {Layout, Menu, Icon} from 'antd';
import './App.css';

const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;

class App extends Component {
  
  render() {
    return (
      <Layout>
        <Header className="header">
          {/* <div className="logo" /> */}
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['2']}
            style={{ lineHeight: '64px' }}
          >
            <Menu.Item key="1">Daskboard</Menu.Item>
            <Menu.Item key="2">Services</Menu.Item>
            <Menu.Item key="3">Setting</Menu.Item>
          </Menu>
        </Header>
        <Layout>
          <Sider width={200} style={{ background: '#fff' }}>
            <Menu
              mode="inline"
              defaultSelectedKeys={['1']}
              defaultOpenKeys={['sub1']}
              style={{ height: '100%', borderRight: 0 }}
            >
              <SubMenu key="sub1" title={<span><Icon type="user" />Admin Setting</span>}>
                <Menu.Item key="1"><Icon type="appstore" />Project List</Menu.Item>
                <Menu.Item key="2"><Icon type="appstore" />Domain List</Menu.Item>
                <Menu.Item key="3"><Icon type="appstore" />Instance List</Menu.Item>
                <Menu.Item key="4"><Icon type="appstore" />Users List</Menu.Item>
              </SubMenu>
           
            </Menu>
          </Sider>
          <Layout style={{height:300,background: '#fff',}}>
            layout
            <Content style={{
              height:500,
              background: '#d8d8d8', 
              padding: 0,
              margin: 0, 
              minHeight: 20,}}>
              content
        </Content>
     
          </Layout>
          co
        </Layout>
      </Layout>
    );
  };
}

export default App;
