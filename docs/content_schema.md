# 内容数据库 Schema (Google Sheets/Airtable)

为了实现自动化生成，内容数据库建议分为以下几个表（Tabs）：

## 1. 城市表 (Cities)
| 字段名 | 类型 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| city_id | String (PK) | 唯一标识符，用于 URL 路径 | melbourne |
| city_name | String | 城市名称 | 墨尔本 |
| seo_title | String | 页面标题 (SEO) | 墨尔本旅游攻略-当地导游定制路线 |
| seo_desc | String | 页面描述 (SEO) | 提供最专业的墨尔本定制游... |
| primary_keyword | String | 核心关键词 | 墨尔本旅游 |
| cover_image | URL | 城市封面图 | https://.../melb_cover.jpg |
| status | Enum | 发布状态 (Draft/Published) | Published |

## 2. 路线表 (Routes)
| 字段名 | 类型 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| route_id | String (PK) | 路线唯一标识 | melb-city-1day |
| city_id | String (FK) | 所属城市 | melbourne |
| route_name | String | 路线名称 | 墨尔本市区一日游 |
| duration | String | 时长 | 1天 |
| price_type | Enum | 报价方式 (固定/定制) | Custom |
| summary | Text | 路线简介 | 涵盖弗林德斯车站、州立图书馆... |
| route_image | URL | 路线缩略图 | https://.../route1.jpg |

## 3. 景点/详细攻略表 (Spots/Details)
| 字段名 | 类型 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| spot_id | String (PK) | 景点唯一标识 | federation-sq |
| route_id | String (FK) | 所属路线 | melb-city-1day |
| spot_name | String | 景点名称 | 联邦广场 |
| description | Text | 详细攻略/介绍 | 墨尔本的文化中心，建议停留1小时... |
| image_url | URL | 景点图片 | https://.../spot1.jpg |
| order | Integer | 在路线中的排序 | 1 |

## 4. 报价与联系表 (Pricing/Contact)
| 字段名 | 类型 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| city_id | String (FK) | 对应城市 | melbourne |
| price_range | String | 价格区间 | ￥2000 - ￥5000 |
| contact_way | String | 联系方式/预约链接 | WhatsApp/WeChat |
