// 复习事项管理系统 - 核心JavaScript逻辑

// 全局变量
let tasks = [];
let taskTypes = ['日常需求', '研发优化', 'OKR事项'];
let currentDate = new Date();
let editingTaskId = null;

// 初始化应用
function init() {
    loadTasks();
    loadTaskTypes();
    renderTable();
    renderCalendar();
    renderTaskTypeOptions();
    loadTheme();
    bindEvents();
}

// 从LocalStorage加载数据
function loadTasks() {
    const storedTasks = localStorage.getItem('review_tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
}

// 保存数据到LocalStorage
function saveTasks() {
    localStorage.setItem('review_tasks', JSON.stringify(tasks));
}

// 从LocalStorage加载事项类型
function loadTaskTypes() {
    const storedTypes = localStorage.getItem('task_types');
    if (storedTypes) {
        taskTypes = JSON.parse(storedTypes);
    }
    // 保存新的默认类型到LocalStorage
    saveTaskTypes();
}

// 保存事项类型到LocalStorage
function saveTaskTypes() {
    localStorage.setItem('task_types', JSON.stringify(taskTypes));
}

// 渲染事项类型选项
function renderTaskTypeOptions() {
    const select = document.getElementById('taskType');
    const typeFilter = document.getElementById('typeFilter');
    
    // 清空现有选项
    select.innerHTML = '';
    typeFilter.innerHTML = '<option value="">所有类型</option>';
    
    // 添加新选项
    taskTypes.forEach(type => {
        // 添加到表单选择框
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
        
        // 添加到筛选选择框
        const filterOption = document.createElement('option');
        filterOption.value = type;
        filterOption.textContent = type;
        typeFilter.appendChild(filterOption);
    });
}

// 绑定事件监听器
function bindEvents() {
    // 新增事项按钮
    document.getElementById('addTaskBtn').addEventListener('click', openAddModal);
    
    // 关闭模态框
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('taskModal').addEventListener('click', (e) => {
        if (e.target.id === 'taskModal') {
            closeModal();
        }
    });
    
    // 表单提交
    document.getElementById('taskForm').addEventListener('submit', handleFormSubmit);
    
    // 全选/取消全选
    document.getElementById('selectAll').addEventListener('change', toggleSelectAll);
    
    // 批量删除
    document.getElementById('batchDeleteBtn').addEventListener('click', batchDelete);
    
    // 筛选功能
    document.getElementById('typeFilter').addEventListener('change', renderTable);
    document.getElementById('priorityFilter').addEventListener('change', renderTable);
    document.getElementById('statusFilter').addEventListener('change', renderTable);
    document.getElementById('startDate').addEventListener('change', renderTable);
    document.getElementById('endDate').addEventListener('change', renderTable);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    
    // 日历导航
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    document.getElementById('todayBtn').addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });
    
    // 数据导入导出
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', handleImport);
    
    // 主题切换
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = e.currentTarget.dataset.theme;
            setTheme(theme);
        });
    });
    
    // 事项类型管理
    document.getElementById('addTypeBtn').addEventListener('click', addTaskType);
    document.getElementById('manageTypeBtn').addEventListener('click', openTypeModal);
    document.getElementById('closeTypeModal').addEventListener('click', closeTypeModal);
    document.getElementById('closeTypeBtn').addEventListener('click', closeTypeModal);
    document.getElementById('typeModal').addEventListener('click', (e) => {
        if (e.target.id === 'typeModal') {
            closeTypeModal();
        }
    });
    
    // 回车键添加类型
    document.getElementById('newTypeInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTaskType();
        }
    });
}

// 打开新增事项模态框
function openAddModal() {
    editingTaskId = null;
    document.getElementById('modalTitle').textContent = '新增事项';
    document.getElementById('taskForm').reset();
    document.getElementById('taskDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('taskId').value = '';
    document.getElementById('taskModal').classList.add('show');
}

// 打开编辑事项模态框
function openEditModal(taskId) {
    editingTaskId = taskId;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        document.getElementById('modalTitle').textContent = '编辑事项';
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskDate').value = task.date;
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskType').value = task.type;
        document.querySelectorAll('input[name="priority"]').forEach(radio => {
            radio.checked = radio.value === task.priority;
        });
        document.getElementById('taskNote').value = task.note || '';
        document.getElementById('taskModal').classList.add('show');
    }
}

// 关闭模态框
function closeModal() {
    document.getElementById('taskModal').classList.remove('show');
    editingTaskId = null;
}

// 处理表单提交
function handleFormSubmit(e) {
    e.preventDefault();
    
    const taskData = {
        id: editingTaskId || Date.now().toString(),
        date: document.getElementById('taskDate').value,
        name: document.getElementById('taskName').value,
        type: document.getElementById('taskType').value,
        priority: document.querySelector('input[name="priority"]:checked').value,
        note: document.getElementById('taskNote').value,
        completed: editingTaskId ? tasks.find(t => t.id === editingTaskId).completed : false
    };
    
    if (editingTaskId) {
        // 编辑现有事项
        const index = tasks.findIndex(t => t.id === editingTaskId);
        tasks[index] = taskData;
        showToast('事项编辑成功', 'success');
    } else {
        // 新增事项
        tasks.push(taskData);
        showToast('事项新增成功', 'success');
    }
    
    saveTasks();
    renderTable();
    renderCalendar();
    closeModal();
}

// 渲染事项表格
function renderTable() {
    const tbody = document.getElementById('taskTableBody');
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">暂无事项</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredTasks.map(task => `
        <tr>
            <td><input type="checkbox" class="task-checkbox" data-id="${task.id}"></td>
            <td>${task.date}</td>
            <td>${task.name}</td>
            <td>${task.type}</td>
            <td>${task.priority}</td>
            <td>
                <button class="status-toggle" onclick="toggleStatus('${task.id}')">
                    ${task.completed ? '✅' : '❌'}
                </button>
            </td>
            <td>
                <div class="action-buttons">
                    <button onclick="openEditModal('${task.id}')">编辑</button>
                    <button class="danger-btn" onclick="deleteTask('${task.id}')">删除</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // 重新绑定事件
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectAll);
    });
}

// 获取筛选后的事项
function getFilteredTasks() {
    const typeFilter = document.getElementById('typeFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    return tasks.filter(task => {
        // 类型筛选
        if (typeFilter && task.type !== typeFilter) return false;
        
        // 优先级筛选
        if (priorityFilter && task.priority !== priorityFilter) return false;
        
        // 状态筛选
        if (statusFilter) {
            const completed = statusFilter === 'true';
            if (task.completed !== completed) return false;
        }
        
        // 日期范围筛选
        if (startDate && task.date < startDate) return false;
        if (endDate && task.date > endDate) return false;
        
        return true;
    });
}

// 切换完成状态
function toggleStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTable();
        renderCalendar();
        showToast('状态已更新', 'info');
    }
}

// 删除单条事项
function deleteTask(taskId) {
    if (confirm('确定要删除这条事项吗？')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTable();
        renderCalendar();
        showToast('事项已删除', 'success');
    }
}

// 切换全选状态
function toggleSelectAll(e) {
    const isChecked = e.target.checked;
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

// 更新全选按钮状态
function updateSelectAll() {
    const checkboxes = document.querySelectorAll('.task-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    document.getElementById('selectAll').checked = allChecked;
}

// 批量删除
function batchDelete() {
    const selectedIds = Array.from(document.querySelectorAll('.task-checkbox:checked'))
        .map(cb => cb.dataset.id);
    
    if (selectedIds.length === 0) {
        showToast('请先选择要删除的事项', 'error');
        return;
    }
    
    if (confirm(`确定要删除选中的${selectedIds.length}条事项吗？`)) {
        tasks = tasks.filter(t => !selectedIds.includes(t.id));
        saveTasks();
        renderTable();
        renderCalendar();
        showToast(`已删除${selectedIds.length}条事项`, 'success');
    }
}

// 重置筛选条件
function resetFilters() {
    document.getElementById('typeFilter').value = '';
    document.getElementById('priorityFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    renderTable();
}

// 渲染日历
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 更新月份显示
    document.getElementById('currentMonth').textContent = `${year}年${month + 1}月`;
    
    const calendarBody = document.getElementById('calendarBody');
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    let calendarHTML = '';
    
    // 生成42个单元格（6周）
    for (let i = 0; i < 42; i++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + i);
        
        const dateStr = cellDate.toISOString().split('T')[0];
        const day = cellDate.getDate();
        const isCurrentMonth = cellDate.getMonth() === month;
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        const dayTasks = tasks.filter(task => task.date === dateStr);
        const hasTasks = dayTasks.length > 0;
        
        let cellClass = 'calendar-day';
        if (!isCurrentMonth) cellClass += ' other-month';
        if (isToday) cellClass += ' today';
        if (hasTasks) cellClass += ' has-task';
        
        // 生成当天的事项列表
        const tasksHTML = dayTasks.map(task => `
            <div class="task-item" title="${task.name}\n类型：${task.type}\n优先级：${task.priority}\n状态：${task.completed ? '已完成' : '未完成'}\n备注：${task.note || '无'}">
                ${task.name.length > 10 ? task.name.substring(0, 10) + '...' : task.name}
            </div>
        `).join('');
        
        calendarHTML += `
            <div class="${cellClass}" onclick="handleCalendarDayClick('${dateStr}')">
                <div class="day-number">${day}</div>
                <div class="day-tasks">${tasksHTML}</div>
            </div>
        `;
    }
    
    calendarBody.innerHTML = calendarHTML;
}

// 日历日期点击事件
function handleCalendarDayClick(dateStr) {
    // 设置筛选条件为点击的日期
    document.getElementById('startDate').value = dateStr;
    document.getElementById('endDate').value = dateStr;
    renderTable();
    showToast(`已筛选${dateStr}的事项`, 'info');
}

// 数据导出功能
function exportData() {
    if (tasks.length === 0) {
        showToast('暂无数据可导出', 'error');
        return;
    }
    
    // 生成CSV表头
    const headers = ['日期', '事项名称', '事项类型', '优先级', '完成状态', '备注'];
    const rows = [headers];
    
    // 生成CSV数据行
    tasks.forEach(task => {
        rows.push([
            task.date,
            `"${task.name}"`, // 处理包含逗号的情况
            task.type,
            task.priority,
            task.completed ? '✅' : '❌',
            `"${task.note || ''}"`
        ]);
    });
    
    // 转换为CSV格式
    const csvContent = rows.map(row => row.join(',')).join('\n');
    
    // 创建下载链接
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    link.setAttribute('href', url);
    link.setAttribute('download', `复习事项_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('数据导出成功', 'success');
}

// 处理文件导入
function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        parseCSV(content);
    };
    reader.readAsText(file, 'utf-8');
    
    // 清空文件输入
    e.target.value = '';
}

// 解析CSV文件
function parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
        showToast('CSV文件格式错误，缺少数据行', 'error');
        return;
    }
    
    // 跳过表头
    const dataLines = lines.slice(1);
    const newTasks = [];
    
    // 解析每一行数据
    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;
        
        // 简单的CSV解析，处理带引号的字段
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField.trim());
        
        // 验证字段
        if (fields.length < 5) {
            showToast(`CSV格式错误：第${i + 2}行字段数量不足`, 'error');
            return;
        }
        
        // 日期格式验证
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(fields[0])) {
            showToast(`CSV格式错误：第${i + 2}行日期格式应为YYYY-MM-DD`, 'error');
            return;
        }
        
        // 事项名称不能为空
        if (!fields[1]) {
            showToast(`CSV格式错误：第${i + 2}行事项名称不能为空`, 'error');
            return;
        }
        
        // 创建新任务
        newTasks.push({
            id: Date.now().toString() + i,
            date: fields[0],
            name: fields[1],
            type: fields[2] || '知识点复习',
            priority: fields[3] || '中',
            completed: fields[4] === '✅',
            note: fields[5] || ''
        });
    }
    
    // 询问导入方式
    if (confirm('选择导入方式：\n- 确定：覆盖现有数据\n- 取消：追加到现有数据')) {
        // 覆盖导入
        tasks = newTasks;
    } else {
        // 追加导入
        tasks = [...tasks, ...newTasks];
    }
    
    saveTasks();
    renderTable();
    renderCalendar();
    showToast(`成功导入${newTasks.length}条数据`, 'success');
}

// 主题切换功能
function setTheme(theme) {
    document.body.className = theme;
    localStorage.setItem('app_theme', theme);
    showToast(`已切换到${getThemeName(theme)}主题`, 'success');
}

// 获取主题名称
function getThemeName(theme) {
    const themeMap = {
        'light': '浅色',
        'dark': '深色',
        'eye-care': '护眼'
    };
    return themeMap[theme] || '浅色';
}

// 加载主题设置
function loadTheme() {
    const savedTheme = localStorage.getItem('app_theme') || 'light';
    setTheme(savedTheme);
}

// 新增事项类型
function addTaskType() {
    const input = document.getElementById('newTypeInput');
    const newType = input.value.trim();
    
    if (!newType) {
        showToast('请输入事项类型名称', 'error');
        return;
    }
    
    if (taskTypes.includes(newType)) {
        showToast('该事项类型已存在', 'error');
        return;
    }
    
    taskTypes.push(newType);
    saveTaskTypes();
    renderTaskTypeOptions();
    input.value = '';
    showToast('事项类型添加成功', 'success');
}

// 打开类型管理模态框
function openTypeModal() {
    renderTypeList();
    document.getElementById('typeModal').classList.add('show');
}

// 关闭类型管理模态框
function closeTypeModal() {
    document.getElementById('typeModal').classList.remove('show');
}

// 渲染类型列表
function renderTypeList() {
    const typeList = document.getElementById('typeList');
    
    if (taskTypes.length === 0) {
        typeList.innerHTML = '<p style="text-align: center; padding: 2rem;">暂无事项类型</p>';
        return;
    }
    
    let html = '<div style="display: flex; flex-direction: column; gap: 1rem;">';
    
    taskTypes.forEach(type => {
        // 检查该类型是否被使用
        const isUsed = tasks.some(task => task.type === type);
        // 计算该类型的使用数量
        const usageCount = tasks.filter(task => task.type === type).length;
        
        html += `
            <div class="type-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; background-color: var(--secondary-color); border-radius: 4px;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span>${type}</span>
                    <span style="font-size: 0.8rem; color: #666;">(${usageCount}个事项)</span>
                </div>
                <button 
                    class="delete-type-btn danger-btn small-btn" 
                    data-type="${type}" 
                    ${isUsed || taskTypes.length <= 1 ? 'disabled title="该类型正在使用或不能删除最后一个类型"' : 'title="删除该类型"'}
                >
                    删除
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    typeList.innerHTML = html;
    
    // 绑定删除事件
    document.querySelectorAll('.delete-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!e.target.disabled) {
                const type = e.target.dataset.type;
                deleteTaskType(type);
            }
        });
    });
}

// 删除事项类型
function deleteTaskType(type) {
    // 校验1：不能删除最后一个类型
    if (taskTypes.length <= 1) {
        showToast('不能删除最后一个事项类型', 'error');
        return;
    }
    
    // 校验2：不能删除正在使用的类型
    const isUsed = tasks.some(task => task.type === type);
    if (isUsed) {
        showToast('该事项类型正在使用中，不能删除', 'error');
        return;
    }
    
    if (confirm(`确定要删除事项类型"${type}"吗？`)) {
        taskTypes = taskTypes.filter(t => t !== type);
        saveTaskTypes();
        renderTaskTypeOptions();
        renderTypeList();
        showToast('事项类型删除成功', 'success');
    }
}

// 显示提示框
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    // 3秒后自动关闭
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 初始化应用
document.addEventListener('DOMContentLoaded', init);
