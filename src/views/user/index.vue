<template>
  <div class="app-container calendar-list-container">

    <!-- 查询和其他操作 -->
    <div class="filter-container">
      <el-input clearable class="filter-item" style="width: 200px;" placeholder="请输入用户名" v-model="listQuery.loginName">
      </el-input>
      <el-input clearable class="filter-item" style="width: 200px;" placeholder="请输入手机号" v-model="listQuery.mobile">
      </el-input>
      <el-select v-model="listQuery.roleId" style="width: 200px;" clearable class="filter-item" placeholder="请选择角色名称">
        <el-option v-for="item in roleMap" :key="item.id" :label="item.nmDisplay" :value="item.id"></el-option>
      </el-select>
      <el-button class="filter-item" type="primary" v-waves icon="el-icon-search" @click="handleFilter">查找</el-button>
      <el-button class="filter-item" type="primary" @click="handleCreate" icon="el-icon-edit">添加</el-button>
    </div>

    <!-- 查询结果 -->
    <el-table size="small" :data="list" @filter-change="filterTag" @sort-change="changeTableSort"
              v-loading="listLoading" element-loading-text="正在查询中。。。" border fit highlight-current-row>
      <el-table-column type="index" align="center" :index="typeIndex" width="100px" label="序号">
      </el-table-column>

      <el-table-column align="center" min-width="120px" label="用户名" prop="loginName">
      </el-table-column>

      <el-table-column align="center" min-width="120px" label="姓名" prop="realName">
      </el-table-column>

      <el-table-column align="center" width="120px" label="手机号" prop="mobile">
      </el-table-column>

      <el-table-column align="center" width="120px" label="角色" prop="roleName">
      </el-table-column>

      <el-table-column align="center" width="100px" label="状态" prop="flgFreeze" @click="filterTag" column-key="flgFreeze"
                       :filters="[{ text: '可用', value: '0' }, { text: '冻结', value: '1' } ]">
        <template slot-scope="scope">
          <el-tag :type="scope.row.flgFreeze | statusFilter" :filter-method="filterTag">{{scope.row.flgFreeze}}</el-tag>
        </template>
      </el-table-column>

      <el-table-column align="center" min-width="180px" label="注册时间" prop="createTime" sortable>
        <template slot-scope="scope">
          <span>{{ scope.row.createTime | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>

      <el-table-column align="center" label="操作" width="250" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="handleUpdate(scope)">编辑</el-button>
          <el-button type="warning" size="mini" @click="handlefreeze(scope.row)" v-if="scope.row.freeze === 0">冻结
          </el-button>
          <el-button type="info" size="mini" @click="handleUnfreeze(scope.row)" v-if="scope.row.freeze === 1">解冻
          </el-button>
          <el-button type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination background @size-change="handleSizeChange" @current-change="handleCurrentChange"
                     :current-page="listQuery.page + 1"
                     :page-sizes="[10,20,30,50]"    
                     :page-size="listQuery.size"
                     layout="total, sizes, prev, pager, next, jumper" 
                     :total="total">
      </el-pagination>
    </div>

    <!-- 添加或修改对话框 -->
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form :rules="rules" ref="dataForm" :model="dataForm" status-icon label-position="right" label-width="100px"
               style='width: 400px; margin-left:80px;'>
        <el-form-item label="用户名" prop="loginName">
          <el-input v-model="dataForm.loginName"></el-input>
        </el-form-item>
        <el-form-item label="手机号码" prop="mobile">
          <el-input v-model="dataForm.mobile"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="dataForm.password" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="checkPassword">
          <el-input type="password" v-model="dataForm.checkPassword" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="dataForm.realName"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="dataForm.roleId" style="width:300px" placeholder="请选择">
            <el-option v-for="item in roleMap" :key="item.id" :label="item.nmDisplay" :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button v-if="dialogStatus=='create'" type="primary" @click="createData" :disabled="isDisabled">确定
        </el-button>
        <el-button v-else type="primary" @click="updateData" :disabled="isDisabled">确定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
  // 导入js方法引用
  import {createUser, deleteObj, fetchList, freezeObj, unfreezeObj, updateUser} from '@/api/user'
  import waves from '@/directive/waves' // 水波纹指令
  import { parseTime } from '@/utils'
  // 导出模块声明
  export default {
    name: 'User',
    directives: {
      waves
    },
    // 初始化数据
    data() {
      // 校验规则
      var validatePass = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请输入密码'))
        } else {
          if (this.dataForm.checkPassword !== '') {
            this.$refs.dataForm.validateField('checkPassword')
          }
          callback()
        }
      }
      var validatePass2 = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请再次输入密码'))
        } else if (value !== this.dataForm.password) {
          callback(new Error('两次输入密码不一致!'))
        } else {
          callback()
        }
      }
      var validateMobile = (rule, value, callback) => {
        var myreg = /^[1][3,4,5,7,8,9][0-9]{9}$/
        if (value === '') {
          callback(new Error('手机号码不能为空'))
        } else if (!myreg.test(value)) {
          callback(new Error('手机号格式有误'))
        } else {
          callback()
        }
      }
      // 返回数据
      return {
        list: null,
        total: null,
        listLoading: true,
        roleMap: {},
        filter: '',
        listQuery: { // 分页数据
          page: 0,
          size: 10,
          username: undefined,
          mobile: undefined,
          freeze: undefined,
          sort: '',
          roleId: ''
        },
        dataForm: {
          id: undefined,
          loginName: '',
          realName: '',
          mobile: '',
          password: undefined,
          checkPassword: undefined,
          roleId: ''
        },
        dialogFormVisible: false,
        isDisabled: false,
        dialogStatus: '',
        textMap: {
          update: '编辑',
          create: '创建'
        },
        // 校验组
        rules: {
          loginName: [{required: true, message: '用户名不能为空', trigger: 'blur'}],
          mobile: [
            {required: true, message: '手机号码不能为空', trigger: 'blur'},
            {validator: validateMobile, trigger: 'blur'}
          ],
          password: [
            {required: true, message: '密码不能为空', trigger: 'blur'},
            {validator: validatePass, trigger: 'blur'}, {min: 6, message: '密码不能小于6位',}
          ],
          checkPassword: [
            {required: true, message: '密码不能为空', trigger: 'blur'},
            {validator: validatePass2, trigger: 'blur'}
          ],
          roleId: [
            {required: true, message: '请选择角色', trigger: 'change'},
          ]
        },
        downloadLoading: false
      }
    },
    // 初始化filter
    filters: {
      statusFilter(status) {
        const statusMap = {
          '0': 'success', // 数据值 对应显示图标颜色
          '1': 'info'
        }
        return statusMap[status]
      }
    },
    // 初始化查询
    created() {
      this.getList()
    },
    methods: {
      // 查询列表
      getList() {
        this.listLoading = true
        fetchList(this.listQuery).then(response => {
          console.log(response)
          this.list = response.content
          this.total = response.totalElements // 总共有多少条数据
          this.listLoading = false
        }).catch(() => {
          this.list = []
          this.total = 0
          this.listLoading = false
        })
      },
      // 排序方法
      changeTableSort(val) {
        const searchKey = val.prop.toString() // 获取key值
        const value = val.order.substr(0, 4) === 'asce' ? 'asc' : val.order.substr(0, 4) // 获取value
        var orderBy = 'u.' + searchKey + ' ' + value
        this.listQuery.sort = orderBy
        this.getList()
      },

      // 点击查询
      handleFilter() {
        this.listQuery.page = 0
        this.getList()
      },
      // 分页数查询
      handleSizeChange(val) {
        this.listQuery.size = val
        this.listQuery.page = 0
        this.getList()
      },
      // 分页
      handleCurrentChange(val) {
        this.listQuery.page = val - 1
        this.getList()
      },
      // 重置提交表单
      resetForm() {
        this.dataForm = {
          id: undefined,
          loginName: '',
          realName: '',
          mobile: '',
          pass: undefined,
          checkPass: undefined,
          roleId: ''
        }
      },
      // 每行数据filter重置,value为筛选值,row.status为数据值
      filterStatus(Object, row) {
        // alert(Object)
        // this.filter = value
        // return row.status === value // 两者相等返回true，显示
      },
      // 点击筛选过滤
      filterTag(filters) {
        // var str = JSON.stringify(filters)
        var str = ''
        for (var i = 0; i < filters.status.length; i++) {
          var index = filters.status.length - 1
          if (index === i) {
            str = str + filters.status[i]
          } else {
            str = str + filters.status[i] + ','
          }
        }
        this.listQuery.freeze = str
        this.listQuery.page = 0
        this.getList()
      },
      // 创建页面
      handleCreate() {
        this.resetForm()
        this.dialogStatus = 'create'
        this.dialogFormVisible = true
        this.$nextTick(() => {
          this.$refs['dataForm'].clearValidate()
        })
      },
      //设置按钮启用时间
      setButton() {
        this.isDisabled = true;
        setTimeout(() => {
          this.isDisabled = false
        }, 3000)
      },
      // 提交创建
      createData() {
        this.setButton();
        this.$refs['dataForm'].validate((valid) => {
          if (valid) {
            createUser(this.dataForm).then(response => { // 提交成功
              if (response) {
                this.list.unshift(response.data.data)
                this.dialogFormVisible = false
                this.getList()
                this.$notify({
                  title: '成功',
                  message: '创建成功',
                  type: 'success',
                  duration: 2000
                })
              }
            }).catch(response => { // 提交失败
              this.$notify({
                title: '失败',
                message: response.data.errmsg,
                type: 'fail',
                duration: 2000
              })
            })
          }
        })
      },
      // 编辑页面
      handleUpdate(scope) {
        //alert(JSON.stringify(scope.row))
        this.dataForm = Object.assign({}, scope.row)
        this.dialogStatus = 'update'
        this.dialogFormVisible = true
        this.$nextTick(() => {
          this.$refs['dataForm'].clearValidate()
        })
      },
      // 提交编辑
      updateData() {
        this.setButton();
        this.$refs['dataForm'].validate((valid) => {
          if (valid) {
            updateUser(this.dataForm).then(response => {
              this.list.unshift(response.data.data)
              this.dialogFormVisible = false
              this.getList()
              this.$notify({
                title: '成功',
                message: '修改成功',
                type: 'success',
                duration: 2000
              })
            }).catch(response => {
              this.$notify({
                title: '失败',
                message: response.data.errmsg,
                type: 'fail',
                duration: 2000
              })
            })
          }
        })
      },
      // 删除
      handleDelete(row) {
        this.$confirm('确认删除用户 "' + row.loginName + '"？')
          .then(_ => {
            deleteObj(row).then(() => {
              this.getList()
              this.$notify({
                title: '成功',
                message: '删除成功',
                type: 'success',
                duration: 2000
              })
            }).catch(() => {
              this.getList()
              this.$notify({
                title: '失败',
                message: '删除失败',
                type: 'fail',
                duration: 2000
              })
            })
          })
      },
      // 冻结
      handlefreeze(row) {
        this.$confirm('确认冻结用户 "' + row.loginName + '"？')
          .then(_ => {
            freezeObj(row).then(() => {
              this.getList()
              this.$notify({
                title: '成功',
                message: '冻结成功',
                type: 'success',
                duration: 2000
              })
            }).catch(() => {
              this.getList()
              this.$notify({
                title: '失败',
                message: '冻结失败',
                type: 'fail',
                duration: 2000
              })
            })
          })
      },
      // 解冻
      handleUnfreeze(row) {
        this.$confirm('确认解冻用户 "' + row.loginName + '"？')
          .then(_ => {
            unfreezeObj(row).then(() => {
              this.getList()
              this.$notify({
                title: '成功',
                message: '解冻成功',
                type: 'success',
                duration: 2000
              })
            }).catch(() => {
              this.getList()
              this.$notify({
                title: '失败',
                message: '解冻失败',
                type: 'fail',
                duration: 2000
              })
            })
          })
      },
      // table序号，当前页数
      typeIndex(index) {
        return index + this.listQuery.page * 10 + 1
      },
      // 导出
      handleDownload() {
        this.listQuery.size = this.total
      }
    }
  }
</script>
