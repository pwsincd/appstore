var appList = {
        packages: []
    },
    fetch = function() {
        var e = {};
        return function(t, a) {
            if (void 0 !== e[t] && "function" == typeof a) a(!0, e[t]);
            else {
                var n = new XMLHttpRequest;
                n.onreadystatechange = function() {
                    if (4 == n.readyState) {
                        var r = 200 == n.status;
                        r && (e[t] = n.responseText), "function" == typeof a && a(200 == n.status, r ? n.responseText : null)
                    }
                }, n.open("GET", t, !0), n.send()
            }
        }
    }(),
    getFormatedDesc = function(e) {
        return e = e.replace(/\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim, '<a href="$&">$&</a>'), e = e.replace(/^\s*\\n|\\n\s*$/g, ""), e = e.replace(/\\t/g, "&#9;"), e = "<p>" + e.replace(/\\n\s*\\n/g, "</p><p>") + "</p>", e = e.replace(/<p>\s*<\/p>/g, ""), e = e.replace(/\\n/g, "<br/>"), e = e.replace(/(<script|<iframe).*?(\/script>|\/iframe>)/g, "")
    },
    appGridComponent = Vue.component("app-grid", {
        template: "#app-grid-template",
        props: ["title", "items", "showButtons"]
    }),
    frontPageView = {
        template: "#front-page-template",
        computed: {
            appList: function() {
                for (var e = [], t = config.categories, a = 0; a < t.length; a++) {
                    var n = t[a],
                        r = this.$parent.appList.packages.filter(function(e) {
                            var t = e.category === n.json_id;
                            return t && (e.img_src = config.getAppImageURL(e.name)), t
                        }),
                        i = (r.length < 6 || n.json_id == "loader") ? 3 : 6;
                    e.push({
                        title: n.id,
                        items: r.splice(0, i)
                    })
                }
                return e
            }
        }
    },
    categoryPageView = {
        template: "#category-page-template",
        computed: {
            appList: function() {
                for (var e = this.$route.params.id, t, a = 0; a < config.categories.length; a++)
                    if (config.categories[a].id === e) {
                        t = config.categories[a].json_id;
                        break
                    }
                return {
                    title: e,
                    items: this.$parent.appList.packages.filter(function(e) {
                        var a = e.category === t;
                        return a && (e.img_src = config.getAppImageURL(e.name)), a
                    })
                }
            }
        }
    },
    searchPageView = {
        template: "#search-page-template",
        data: function() {
            return {
                searchQuery: ""
            }
        },
        computed: {
            appList: function() {
                var e = this.$route.params.query || "",
                    t = new RegExp(decodeURI(e), "gi");
                return {
                    items: this.$parent.appList.packages.filter(function(e) {
                        var a = t.test(e.name) || t.test(e.author);
                        return a && (e.img_src = config.getAppImageURL(e.name)), a
                    })
                }
            }
        },
        methods: {
            submitQuery: function(e) {
                return this.$router.push("/search/" + encodeURI(this.searchQuery)), e.preventDefault(), !1
            }
        },
        beforeRouteEnter: function(e, t, a) {
            a(function(e) {
                e.searchQuery = e.$route.params.query || ""
            })
        }
    },
    appPageView = {
        template: "#app-page-template",
        data: function() {
            return {
                change: "",
                formatted_desc: "",
                download_link: ""
            }
        },
        computed: {
            app: function() {
                var e = this.$route.params.id,
                    t = this.$parent.appList.packages.filter(function(t) {
                        var a = t.name === e;
                        return a && (t.scr_src = config.getAppScreenURL(t.name)), a
                    }),
                    a = t.length > 0 && t[0];
                return a && (this.$data.change = getFormatedDesc(a.changelog), this.$data.formatted_desc = getFormatedDesc(a.details), this.$data.download_link = config.getAppDownloadURL(a.name, a.binary)), a
            }
        }
    },
    app = new Vue({
        el: "#app",
        data: {
            appList: appList,
            categories: config.categories,
            sideMenuIsOpen: !1
        },
        methods: {
            showSideMenu: function() {
                this.sideMenuIsOpen = !0
            },
            hideSideMenu: function() {
                this.sideMenuIsOpen = !1
            },
            toggleSideMenu: function() {
                var e = this.sideMenuIsOpen ? this.hideSideMenu : this.showSideMenu;
                e()
            }
        },
        router: new VueRouter({
            routes: [{
                path: "/",
                component: frontPageView
            }, {
                path: "/category/:id",
                component: categoryPageView
            }, {
                path: "/search/:query",
                component: searchPageView
            }, {
                path: "/search/",
                component: searchPageView
            }, {
                path: "/app/:id",
                component: appPageView
            }],
            linkActiveClass: "is-active"
        }),
        watch: {
            $route: function(e, t) {
                window.scrollTo(0, 0), this.hideSideMenu()
            }
        },
        created: function() {
            fetch(config.appListURL, function(e, t) {
                e ? this.appList = JSON.parse(t) : console.warn("There was an error fetching the App List JSON from the server")
            }.bind(this))
        }
    });


