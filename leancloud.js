/**
 * LeanCloud数据同步模块
 * 实现与LeanCloud的通信，包括数据存储、查询和实时同步
 */

// LeanCloud配置
const LC_APP_ID = 'i3HOlSULshlcZHb2eLPPeAeq-gzGzoHsz';
const LC_APP_key = 'RIRWzdOmEoM02P4gbAEXQp69';
const LC_SERVER_URL = 'https://i3holsul.lc-cn-n1-shared.com'; // 国内国内节点需要配置

// 初始化LeanCloud
if (typeof AV !== 'undefined') {
    AV.init({
        appId: LC_APP_ID,
        appKey: LC_APP_KEY,
        serverURLs: LC_SERVER_URL
    });
    
    console.log('LeanCloud初始化成功');
} else {
    console.error('LeanCloud SDK未加载');
}

// 数据同步类
class LeanCloudSync {
    constructor() {
        // 数据同步状态
        this.syncStatus = {
            lastSyncTime: null,
            isSyncing: false,
            syncError: null
        };
        
        // 本地数据缓存
        this.localData = {
            instruments: [],
            meetings: [],
            deviations: [],
            users: [],
            auditLogs: []
        };
        
        // 实时通信
        this.realtime = null;
        this.connection = null;
        this.channels = {};
        
        // 绑定事件监听器
        this.bindEventListeners();
    }
    constructor() {
        // 数据同步状态
        this.syncStatus = {
            lastSyncTime: null,
            isSyncing: false,
            syncError: null
        };
        
        // 本地数据缓存
        this.localData = {
            instruments: [],
            meetings: [],
            deviations: [],
            users: [],
            auditLogs: []
        };
        
        // 实时时通信
        this.realtime = null;
        this.connection = null;
        this.channels = {};
    }
    
    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 监听数据变更事件
        document.addEventListener('lc:saveInstrument', (e) => {
            this.saveInstrument(e.detail.data);
        });
        
        document.addEventListener('lc:deleteInstrument', (e) => {
            this.deleteInstrument(e.detail.id);
        });
        
        document.addEventListener('lc:saveMeeting', (e) => {
            this.saveMeeting(e.detail.data);
        });
        
        document.addEventListener('lc:deleteMeeting', (e) => {
            this.deleteMeeting(e.detail.id);
        });
        
        document.addEventListener('lc:saveDeviation', (e) => {
            this.saveDeviation(e.detail.data);
        });
        
        document.addEventListener('lc:deleteDeviation', (e) => {
            this.deleteDeviation(e.detail.id);
        });
        
        document.addEventListener('lc:saveUser', (e) => {
            this.saveUser(e.detail.data);
        });
        
        document.addEventListener('lc:deleteUser', (e) => {
            this.deleteUser(e.detail.id);
        });
        
        document.addEventListener('lc:saveAuditLog', (e) => {
            this.saveAuditLog(e.detail.data);
        });
        
        // 监听同步请求事件
        document.addEventListener('lc:requestSync', () => {
            this.syncData();
        });
    }
    
    /**
     * 初始化实时通信
     */
    async initRealtime() {
        try {
            // 检查是否已加载Realtime SDK
            if (typeof Realtime !== 'undefined') {
                this.realtime = new Realtime({
                    appId: LC_APP_ID,
                    appKey: LC_APP_KEY,
                    serverURLs: LC_SERVER_URL
                });
                
                // 登录匿名用户（实际应用中应该使用用户系统）
                this.connection = await this.realtime.createIMClient('anonymous-' + Math.random().toString(36).substr(2, 9));
                console.log('实时通信初始化成功');
                
                // 订阅频道
                this.setupChannels();
                
                return true;
            } else {
                console.error('LeanCloud Realtime SDK未加载');
                return false;
            }
        } catch (error) {
            console.error('实时通信初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 设置频道监听
     */
    setupChannels() {
        const channelNames = ['instruments', 'meetings', 'deviations', 'users', 'auditLogs'];
        
        channelNames.forEach(async (channelName) => {
            try {
                this.channels[channelName] = await this.connection.channel(channelName);
                await this.channels[channelName].join();
                
                // 监听频道消息
                this.channels[channelName].on('message', (message) => {
                    console.log(`收到${channelName}频道消息:`, message);
                    this.handleChannelMessage(channelName, message);
                });
                
                console.log(`订阅${channelName}频道成功`);
            } catch (error) {
                console.error(`订阅${channelName}频道失败:`, error);
            }
        });
    }
    
    /**
     * 处理频道消息
     */
    handleChannelMessage(channelName, message) {
        switch (message.type) {
            case 'create':
                this.handleCreateEvent(channelName, message.data);
                break;
            case 'update':
                this.handleUpdateEvent(channelName, message.data);
                break;
            case 'delete':
                this.handleDeleteEvent(channelName, message.data);
                break;
            case 'sync':
                this.syncData();
                break;
        }
    }
    
    /**
     * 处理创建事件
     */
    handleCreateEvent(channelName, data) {
        console.log(`收到${channelName}创建事件`, data);
        this.syncData();
    }
    
    /**
     * 处理更新事件
     */
    handleUpdateEvent(channelName, data) {
        console.log(`收到到${channelName}更新事件`, data);
        this.syncData();
    }
    
    /**
     * 处理删除事件
     */
    handleDeleteEvent(channelName, data) {
        console.log(`收到${channelName}删除事件`, data);
        this.syncData();
    }
    
    /**
     * 广播数据变更
     */
    async broadcastChange(channelName, type, data) {
        try {
            if (this.channels[channelName]) {
                await this.channels[channelName].send({
                    type: type,
                    data: data,
                    timestamp: new Date().toISOString()
                });
                console.log(`广播${channelName}${type}事件成功`);
            }
        } catch (error) {
            console.error(`广播数据变更失败:', error);
        }
    }
    
    /**
     * 同步所有数据
     */
    async syncData() {
        if (this.syncStatus.isSyncing) {
            console.log('正在同步中，跳过本次请求');
            return false;
        }
        
        try {
            this.syncStatus.isSyncing = true;
            this.syncStatus.syncError = null;
            
            console.log('开始同步数据...');
            
            // 同步所有数据类型
            await Promise.all([
                this.syncInstruments(),
                this.syncMeetings(),
                this.syncDeviations(),
                this.syncUsers(),
                this.syncAuditLogs()
            ]);
            
            this.syncStatus.lastSyncTime = new Date();
            console.log('数据同步完成');
            
            // 触发同步完成事件
            this.triggerSyncComplete();
            
            return true;
        } catch (error) {
            this.syncStatus.syncError = error;
            console.error('数据同步失败:', error);
            return false;
        } finally {
            this.syncStatus.isSyncing = false;
        }
    }
    
    /**
     * 同步仪器数据
     */
    async syncInstruments() {
        try {
            const Instrument = AV.Object.extend('Instrument');
            const query = new AV.Query(Instrument);
            
            // 获取所有仪器数据
            const results = await query.find();
            
            // 转换为本地数据格式
            this.localData.instruments = results.map(instrument => {
                return {
                    id: instrument.id,
                    code: instrument.get('code'),
                    name: instrument.get('name'),
                    roomNumber: instrument.get('roomNumber'),
                    status: instrument.get('status'),
                    maintenanceRecords: instrument.get('maintenanceRecords') || [],
                    createdAt: instrument.get('createdAt') ? instrument.get('createdAt').toISOString() : null,
                    updatedAt: instrument.get('updatedAt') ? instrument.get('updatedAt').toISOString() : null
                };
            });
            
            console.log(`同步到${this.localData.instruments.length}条仪器数据`);
            
            // 更新本地存储
            localStorage.setItem('instrumentData', JSON.stringify({
                instruments: this.localData.instruments
            }));
            
            return this.localData.instruments;
        } catch (error) {
            console.error('同步仪器数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 同步会议纪要数据
     */
    async syncMeetings() {
        try {
            const MeetingRecord = AV.Object.extend('MeetingRecord');
            const query = new AV.Query(MeetingRecord);
            
            // 获取所有会议纪要数据
            const results = await query.find();
            
            // 转换为本地数据格式
            this.localData.meetings = results.map(meeting => {
                return {
                    id: meeting.id,
                    title: meeting.get('title'),
                    content: meeting.get('content'),
                    createdBy: meeting.get('createdBy'),
                    createdAt: meeting.get('createdAt') ? meeting.get('createdAt').toISOString() : null,
                    updatedAt: meeting.get('updatedAt') ? meeting.get('updatedAt').toISOString() : null
                };
            });
            
            console.log(`同步到${this.localData.meetings.length}条会议纪要数据`);
            
            // 更新本地存储
            localStorage.setItem('meetingData', JSON.stringify({
                meetings: this.localData.meetings
            }));
            
            return this.localData.meetings;
        } catch (error) {
            console.error('同步会议纪要数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 同步偏离记录数据
     */
    async syncDeviations() {
        try {
            const DeviationRecord = AV.Object.extend('DeviationRecord');
            const query = new AV.Query(DeviationRecord);
            
            // 获取所有偏离记录数据
            const results = await query.find();
            
            // 转换为本地数据格式
            this.localData.deviations = results.map(deviation => {
                return {
                    id: deviation.id,
                    title: deviation.get('title'),
                    content: deviation.get('content'),
                    status: deviation.get('status'),
                    createdBy: deviation.get('createdBy'),
                    createdAt: deviation.get('createdAt') ? deviation.get('createdAt').toISOString() : null,
                    updatedAt: deviation.get('updatedAt') ? deviation.get('updatedAt').toISOString() : null
                };
            });
            
            console.log(`同步到${this.localData.deviations.length}条偏离记录数据`);
            
            // 更新本地存储
            localStorage.setItem('deviationData', JSON.stringify({
                deviations: this.localData.deviations
            }));
            
            return this.localData.deviations;
        } catch (error) {
            console.error('同步偏离记录数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 同步用户数据
     */
    async syncUsers() {
        try {
            const User = AV.Object.extend('User');
            const query = new AV.Query(User);
            
            // 获取所有用户数据
            const results = await query.find();
            
            // 转换为本地数据格式
            this.localData.users = results.map(user => {
                return {
                    id: user.id,
                    username: user.get('username'),
                    password: user.get('password'), // 注意：实际应用中密码应该加密存储
                    role: user.get('role'),
                    lastLogin: user.get('lastLogin') ? user.get('lastLogin').toISOString() : null,
                    isActive: user.get('isActive') !== undefined ? user.get('isActive') : true
                };
            });
            
            console.log(`同步到${this.localData.users.length}条用户数据`);
            
            // 更新本地存储
            localStorage.setItem('userData', JSON.stringify({
                users: this.localData.users
            }));
            
            return this.localData.users;
        } catch (error) {
            console.error('同步用户数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 同步审计日志数据
     */
    async syncAuditLogs() {
        try {
            const AuditLog = AV.Object.extend('AuditLog');
            const query = new AV.Query(AuditLog);
            
            // 按时间倒序排序
            query.descending('timestamp');
            
            // 限制获取最近的100条记录
            query.limit(100);
            
            // 获取审计日志数据
            const results = await query.find();
            
            // 转换为本地数据格式
            this.localData.auditLogs = results.map(log => {
                return {
                    id: log.id,
                    user: log.get('user'),
                    action: log.get('action'),
                    details: log.get('details'),
                    timestamp: log.get('timestamp') ? log.get('timestamp').toISOString() : null,
                    dataSnapshot: log.get('dataSnapshot')
                };
            });
            
            console.log(`同步到${this.localData.auditLogs.length}条审计日志数据`);
            
            // 更新本地存储
            localStorage.setItem('auditData', JSON.stringify({
                logs: this.localData.auditLogs
            }));
            
            return this.localData.auditLogs;
        } catch (error) {
            console.error('同步审计日志数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 保存仪器数据
     */
    async saveInstrument(instrumentData) {
        try {
            const Instrument = AV.Object.extend('Instrument');
            let instrument;
            
            if (instrumentData.id) {
                // 更新现有仪器
                instrument = AV.Object.createWithoutData('Instrument', instrumentData.id);
            } else {
                // 创建新仪器
                instrument = new Instrument();
            }
            
            // 设置属性
            instrument.set('code', instrumentData.code);
            instrument.set('name', instrumentData.name);
            instrument.set('roomNumber', instrumentData.roomNumber);
            instrument.set('status', instrumentData.status);
            instrument.set('maintenanceRecords', instrumentData.maintenanceRecords || []);
            instrument.set('createdAt', instrumentData.createdAt ? new Date(instrumentData.createdAt) : new Date());
            instrument.set('updatedAt', new Date());
            
            // 保存到LeanCloud
            const result = await instrument.save();
            
            console.log(`保存仪器${instrumentData.id ? '更新' : '创建'}成功`);
            
            // 广播数据变更
            this.broadcastChange('instruments', instrumentData.id ? 'update' : 'create', {
                id: result.id,
                code: instrumentData.code
            });
            
            // 同步数据
            this.syncInstruments();
            
            return result;
        } catch (error) {
            console.error('保存仪器数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 删除仪器数据
     */
    async deleteInstrument(instrumentId) {
        try {
            const instrument = AV.Object.createWithoutData('Instrument', instrumentId);
            
            // 删除数据
            await instrument.destroy();
            
            console.log(`删除仪器${instrumentId}成功`);
            
            // 广播数据变更
            this.broadcastChange('instruments', 'delete', {
                id: instrumentId
            });
            
            // 同步数据
            this.syncInstruments();
            
            return true;
        } catch (error) {
            console.error('删除仪器数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 保存会议纪要数据
     */
    async saveMeeting(meetingData) {
        try {
            const MeetingRecord = AV.Object.extend('MeetingRecord');
            let meeting;
            
            if (meetingData.id) {
                // 更新现有会议纪要
                meeting = AV.Object.createWithoutData('MeetingRecord', meetingData.id);
            } else {
                // 创建新会议纪要
                meeting = new MeetingRecord();
            }
            
            // 设置属性
            meeting.set('title', meetingData.title);
            meeting.set('content', meetingData.content);
            meeting.set('createdBy', meetingData.createdBy);
            meeting.set('createdAt', meetingData.createdAt ? new Date(meetingData.createdAt) : new Date());
            meeting.set('updatedAt', new Date());
            
            // 保存到LeanCloud
            const result = await meeting.save();
            
            console.log(`保存会议纪要${meetingData.id ? '更新' : '创建'}成功`);
            
            // 广播数据变更
            this.broadcastChange('meetings', meetingData.id ? 'update' : 'create', {
                id: result.id,
                title: meetingData.title
            });
            
            // 同步数据
            this.syncMeetings();
            
            return result;
        } catch (error) {
            console.error('保存会议纪要数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 删除会议纪要数据
     */
    async deleteMeeting(meetingId) {
        try {
            const meeting = AV.Object.createWithoutData('MeetingRecord', meetingId);
            
            // 删除数据
            await meeting.destroy();
            
            console.log(`删除会议纪要${meetingId}成功`);
            
            // 广播数据变更
            this.broadcastChange('meetings', 'delete', {
                id: meetingId
            });
            
            // 同步数据
            this.syncMeetings();
            
            return true;
        } catch (error) {
            console.error('删除会议纪要数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 保存偏离记录数据
     */
    async saveDeviation(deviationData) {
        try {
            const DeviationRecord = AV.Object.extend('DeviationRecord');
            let deviation;
            
            if (deviationData.id) {
                // 更新现有偏离记录
                deviation = AV.Object.createWithoutData('DeviationRecord', deviationData.id);
            } else {
                // 创建新偏离记录
                deviation = new DeviationRecord();
            }
            
            // 设置属性
            deviation.set('title', deviationData.title);
            deviation.set('content', deviationData.content);
            deviation.set('status', deviationData.status);
            deviation.set('createdBy', deviationData.createdBy);
            deviation.set('createdAt', deviationData.createdAt ? new Date(deviationData.createdAt) : new Date());
            deviation.set('updatedAt', new Date());
            
            // 保存到LeanCloud
            const result = await deviation.save();
            
            console.log(`保存偏离记录${deviationData.id ? '更新' : '创建'}成功`);
            
            // 广播数据变更
            this.broadcastChange('deviations', deviationData.id ? 'update' : 'create', {
                id: result.id,
                title: deviationData.title
            });
            
            // 同步数据
            this.syncDeviations();
            
            return result;
        } catch (error) {
            console.error('保存偏离记录数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 删除偏离记录数据
     */
    async deleteDeviation(deviationId) {
        try {
            const deviation = AV.Object.createWithoutData('DeviationRecord', deviationId);
            
            // 删除数据
            await deviation.destroy();
            
            console.log(`删除偏离记录${deviationId}成功`);
            
            // 广播数据变更
            this.broadcastChange('deviations', 'delete', {
                id: deviationId
            });
            
            // 同步数据
            this.syncDeviations();
            
            return true;
        } catch (error) {
            console.error('删除偏离记录数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 保存用户数据
     */
    async saveUser(userData) {
        try {
            const User = AV.Object.extend('User');
            let user;
            
            if (userData.id) {
                // 更新现有用户
                user = AV.Object.createWithoutData('User', userData.id);
            } else {
                // 创建新用户
                user = new User();
            }
            
            // 设置属性
            user.set('username', userData.username);
            user.set('password', userData.password); // 注意：实际应用中密码应该加密存储
            user.set('role', userData.role);
            user.set('lastLogin', userData.lastLogin ? new Date(userData.lastLogin) : null);
            user.set('isActive', userData.isActive !== undefined ? userData.isActive : true);
            
            // 保存到LeanCloud
            const result = await user.save();
            
            console.log(`保存用户${userData.id ? '更新' : '创建'}成功`);
            
            // 广播数据变更
            this.broadcastChange('users', userData.id ? 'update' : 'create', {
                id: result.id,
                username: userData.username
            });
            
            // 同步数据
            this.syncUsers();
            
            return result;
        } catch (error) {
            console.error('保存用户数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 删除用户数据
     */
    async deleteUser(userId) {
        try {
            const user = AV.Object.createWithoutData('User', userId);
            
            // 删除数据
            await user.destroy();
            
            console.log(`删除用户${userId}成功`);
            
            // 广播数据变更
            this.broadcastChange('users', 'delete', {
                id: userId
            });
            
            // 同步数据
            this.syncUsers();
            
            return true;
        } catch (error) {
            console.error('删除用户数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 保存审计日志数据
     */
    async saveAuditLog(logData) {
        try {
            const AuditLog = AV.Object.extend('AuditLog');
            const log = new AuditLog();
            
            // 设置属性
            log.set('user', logData.user);
            log.set('action', logData.action);
            log.set('details', logData.details);
            log.set('timestamp', new Date());
            log.set('dataSnapshot', logData.dataSnapshot);
            
            // 保存到LeanCloud
            const result = await log.save();
            
            console.log('保存审计日志成功');
            
            // 广播数据变更
            this.broadcastChange('auditLogs', 'create', {
                id: result.id,
                action: logData.action
            });
            
            // 同步数据
            this.syncAuditLogs();
            
            return result;
        } catch (error) {
            console.error('保存审计日志数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 获取同步状态
     */
    getSyncStatus() {
        return this.syncStatus;
    }
    
    /**
     * 获取本地缓存数据
     */
    getLocalData() {
        return this.localData;
    }
    
    /**
     * 触发同步完成事件
     */
    triggerSyncComplete() {
        const event = new CustomEvent('lc:syncComplete', {
            detail: {
                lastSyncTime: this.syncStatus.lastSyncTime
            }
        });
        
        document.dispatchEvent(event);
    }
    
    /**
     * 触发同步错误事件
     */
    triggerSyncError(error) {
        const event = new CustomEvent('lc:syncError', {
            detail: {
                error: error
            }
        });
        
        document.dispatchEvent(event);
    }
}

// 创建单例实例
const lcSync = new LeanCloudSync();

// 导出实例
window.lcSync = lcSync;

// 添加全局同步函数
window.syncData = async function() {
    return await lcSync.syncData();
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 初始化实时通信
        await lcSync.initRealtime();
        
        // 首次同步数据
        setTimeout(() => {
            lcSync.syncData();
        }, 1000);
        
        // 设置定时同步（每30分钟）
        setInterval(() => {
            console.log('定时同步数据...');
            lcSync.syncData();
        }, 30 * 60 * 1000);
    } catch (error) {
        console.error('LeanCloud初始化失败:', error);
    }
});
