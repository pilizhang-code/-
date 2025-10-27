# 实验室仪器管理系统

一个基于Web的实验室仪器管理系统，支持仪器维护跟踪、信息管理、会议纪要记录、偏离管理及系统配置功能，并实现多人协作使用。

## 功能特点

- **仪器管理**：记录仪器基本信息、状态、维护周期等
- **维护跟踪**：记录维护历史，自动提醒下次维护时间
- **会议纪要**：记录实验室会议内容，支持富文本编辑
- **偏离管理**：记录和跟踪仪器使用过程中的偏离情况
- **用户管理**：支持多用户协作，权限控制
- **数据同步**：基于LeanCloud实现实时数据同步
- **响应式设计**：适配各种设备屏幕

## 技术栈

- HTML5
- CSS3 (Tailwind CSS)
- JavaScript
- LeanCloud (数据存储和实时通信)
- Chart.js (数据可视化)

## 部署指南

### 1. 准备工作

- 注册GitHub账号
- 注册LeanCloud账号
- 安装Git

### 2. 创建LeanCloud应用

1. 登录LeanCloud控制台
2. 创建新应用
3. 在应用中创建以下Class：
   - Instrument (仪器信息)
   - MaintenanceRecord (维护记录)
   - MeetingRecord (会议纪要)
   - DeviationRecord (偏离管理)
   - User (用户信息)
   - AuditLog (审计日志)
4. 获取应用的App ID和App Key

### 3. 配置项目

1. 克隆项目到本地：
   ```bash
   git clone https://github.com/yourusername/lab-instrument-management-system.git
   cd lab-instrument-management-system
   ```

2. 编辑`js/leancloud.js`文件，替换以下配置：
   ```javascript
   const LC_APP_ID = '你的App ID';
   const LC_APP_KEY = '你的App Key';
   const LC_SERVER_URL = 'https://你的应用域名.leancloud.cn'; // 国内节点需要配置
   ```

3. 编辑`index.html`文件，确保LeanCloud SDK引用正确：
   ```html
   <!-- LeanCloud SDK -->
   <script src="https://cdn.jsdelivr.net/npm/leancloud-storage@4.13.0/dist/av-min.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/leancloud-realtime@4.0.0/dist/realtime-min.js"></script>
   ```

### 4. 部署到GitHub Pages

1. 创建GitHub仓库：
   - 在GitHub上创建一个新仓库，命名为`lab-instrument-management-system`
   - 注意：仓库名称可以自定义，但建议与项目名称一致

2. 提交代码：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/lab-instrument-management-system.git
   git push -u origin main
   ```

3. 启用GitHub Pages：
   - 进入仓库设置
   - 找到"Pages"部分
   - 选择"main"分支和"/"根目录
   - 点击"Save"保存设置
   - 等待几分钟，访问`https://yourusername.github.io/lab-instrument-management-system/`查看部署结果

### 5. 配置LeanCloud安全设置

1. 进入LeanCloud应用控制台
2. 选择"设置" > "安全中心"
3. 添加GitHub Pages Pages域名到"Web安全域名"
   - 例如：`https://yourusername.github.io`
4. 启用API访问限制，确保只有你的域名可以访问API

### 6. 初始化管理员账号

1. 访问部署后的应用
2. 使用默认管理员账号登录：
   - 用户名：admin
   - 密码：admin123
3. 登录后建议立即修改密码
4. 添加其他用户账号

## 使用说明

### 数据同步

系统会自动在以下时机同步数据：
- 用户登录时
- 点击"同步数据"按钮时
- 每30分钟自动同步一次

### 导入导出

- **导出**：支持将数据导出为CSV格式
- **导入**：支持从Excel文件导入仪器数据（需要导入模板）

### 维护提醒

- 系统会在下次维护日期前20天内显示"完成维护"按钮
- 仪表盘会显示近期需要维护的仪器列表

## 常见问题

### Q: 数据同步失败怎么办？

A: 检查以下几点：
1. LeanCloud配置是否正确
2. 网络连接是否正常
3. 用户是否有权限访问数据
4. LeanCloud应用是否已过期或欠费

### Q: 如何备份数据？

A: 可以通过以下方式备份数据：
1. 使用系统的导出功能，定期导出数据
2. 在LeanCloud控制台中手动备份数据
3. 设置LeanCloud自动备份

### Q: 如何恢复数据？

A: 可以通过审计日志中的数据快照进行恢复，或使用LeanCloud的备份恢复功能。

## 许可证

MIT License
