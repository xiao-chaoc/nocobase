# NocoBase 自动化接入适配层

本共享包用于描述后续自动化接入 NocoBase 的抽象适配层、注册计划、校验器和 dry-run 执行器。

当前状态：

- 不连接真实 NocoBase。
- 不安装真实插件。
- 不创建数据库表。
- 不创建页面、菜单或权限。
- 不导入真实数据。
- 不调用真实 IOPGPS。
- 不生成真实合同文件。

后续接入完整 NocoBase 工程后，应由真实 adapter 实现 `NocobaseAutomationAdapter` 接口，并把 dry-run 计划逐步替换为真实插件生命周期、Collection/migration、ACL、页面配置、测试数据导入和 smoke test 执行。
