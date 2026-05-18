# MySQL 初始化约定

当前骨架阶段的关系型 schema 由后端 Flyway 管理，迁移文件位于 `backend/src/main/resources/db/migration/`。

这个目录只保留给后续需要在容器初始化阶段执行的 MySQL 脚本，不在骨架阶段承载业务表结构。
