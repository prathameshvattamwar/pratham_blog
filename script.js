document.addEventListener('DOMContentLoaded', () => {
    const storageKey = 'blogPosts';
    const adminSessionKey = 'isAdminLoggedIn';
    const ADMIN_PASSWORD = 'password123';

    const confirmModalElement = document.getElementById('confirmation-modal');
    const confirmModalMessageElement = document.getElementById('modal-message');
    const confirmModalConfirmBtn = document.getElementById('modal-confirm-btn');
    const confirmModalCancelBtn = document.getElementById('modal-cancel-btn');
    let confirmCallback = null;

    const passwordModalElement = document.getElementById('password-modal');
    const passwordForm = document.getElementById('password-form');
    const passwordInput = document.getElementById('admin-password-input');
    const passwordCancelBtn = document.getElementById('password-cancel-btn');

    const showConfirmationModal = (message, onConfirm) => {
        if (!confirmModalElement || !confirmModalMessageElement) return;
        confirmModalMessageElement.textContent = message;
        confirmCallback = onConfirm;
        confirmModalElement.style.display = 'flex';
        setTimeout(() => confirmModalElement.classList.add('visible'), 10);
    };

    const hideConfirmationModal = () => {
        if (!confirmModalElement) return;
        confirmModalElement.classList.remove('visible');
        setTimeout(() => {
            confirmModalElement.style.display = 'none';
            confirmCallback = null;
        }, 300);
    };

    if (confirmModalConfirmBtn) {
        confirmModalConfirmBtn.addEventListener('click', () => {
            if (typeof confirmCallback === 'function') {
                confirmCallback();
            }
            hideConfirmationModal();
        });
    }

    if (confirmModalCancelBtn) {
        confirmModalCancelBtn.addEventListener('click', hideConfirmationModal);
    }

    confirmModalElement?.addEventListener('click', (e) => {
        if (e.target === confirmModalElement) {
            hideConfirmationModal();
        }
    });

    const showPasswordModal = () => {
        if (!passwordModalElement || !passwordInput) return;
        passwordInput.value = '';
        passwordModalElement.style.display = 'flex';
         setTimeout(() => {
            passwordModalElement.classList.add('visible');
            passwordInput.focus();
        }, 10);
    };

    const hidePasswordModal = () => {
        if (!passwordModalElement) return;
        passwordModalElement.classList.remove('visible');
        setTimeout(() => {
            passwordModalElement.style.display = 'none';
        }, 300);
    };

    if(passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
             if (!passwordInput) return;
            const enteredPassword = passwordInput.value;
            if (enteredPassword === ADMIN_PASSWORD) {
                setAdminLogin(true);
                alert('Admin login successful!');
                hidePasswordModal();
            } else {
                alert('Incorrect password.');
                setAdminLogin(false);
                passwordInput.select(); // Select text for easy re-entry
                passwordInput.focus();
            }
        });
    }

    if (passwordCancelBtn) {
        passwordCancelBtn.addEventListener('click', hidePasswordModal);
    }

     passwordModalElement?.addEventListener('click', (e) => {
        if (e.target === passwordModalElement) {
            hidePasswordModal();
        }
    });


    const checkAdminLogin = () => {
        return sessionStorage.getItem(adminSessionKey) === 'true';
    };

    const setAdminLogin = (isLoggedIn) => {
        sessionStorage.setItem(adminSessionKey, isLoggedIn);
        updateAdminUI();
    };

    const getPosts = () => {
        const posts = localStorage.getItem(storageKey);
        return posts ? JSON.parse(posts) : [];
    };

    const savePosts = (posts) => {
        localStorage.setItem(storageKey, JSON.stringify(posts));
    };

    const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const getUrlParameter = (name) => {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };

    const updateAdminUI = () => {
        const isLoggedIn = checkAdminLogin();
        const loginBtn = document.getElementById('admin-login-btn');
        const logoutBtn = document.getElementById('admin-logout-btn');
        const adminActionElements = document.querySelectorAll('.admin-actions');

        if (loginBtn) loginBtn.style.display = isLoggedIn ? 'none' : 'inline-flex';
        if (logoutBtn) logoutBtn.style.display = isLoggedIn ? 'inline-flex' : 'none';

        adminActionElements.forEach(el => {
            el.style.display = isLoggedIn ? 'inline-flex' : 'none';
        });

        if (document.body.id === 'page-create') {
            const editId = getUrlParameter('editId');
            const submitButton = document.querySelector('#create-post-form button[type="submit"]');
            const pageTitle = document.querySelector('.create-post-form h1');
            if (editId && isLoggedIn) {
                 if (pageTitle) pageTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Your Blog Post';
                 if (submitButton) submitButton.innerHTML = '<i class="fas fa-save"></i> Update Post';
            } else if (!editId) {
                 if (pageTitle) pageTitle.innerHTML = '<i class="fas fa-edit"></i> Write Your New Blog Post';
                 if (submitButton) submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Post';
            }
             if(editId && !isLoggedIn) {
             }
        }
    };

    const handleEditPost = (postId) => {
        if (!checkAdminLogin()) {
            alert('You must be logged in as admin to edit posts.');
            return;
        }
        window.location.href = `create.html?editId=${postId}`;
    };

    const handleDeletePost = (postId) => {
        if (!checkAdminLogin()) {
            alert('You must be logged in as admin to delete posts.');
            return;
        }

        const message = 'Are you sure you want to delete this post and its comments? This cannot be undone.';

        showConfirmationModal(message, () => {
            let posts = getPosts();
            const updatedPosts = posts.filter(p => p.id !== postId);
            savePosts(updatedPosts);

            alert('Post deleted successfully.');

            if (document.body.id === 'page-post' && getUrlParameter('id') === postId) {
                window.location.href = 'index.html';
            } else if (document.body.id === 'page-index') {
                displayPosts();
                displayTags();
            } else {
                 window.location.href = 'index.html';
            }
        });
    };


    const displayPosts = (filterTag = null) => {
        const postListContainer = document.getElementById('blog-post-list');
        if (!postListContainer) return;

         const posts = getPosts();
         let filteredPosts = posts;

         if (filterTag && filterTag !== 'all') {
             filteredPosts = posts.filter(post => post.tags && post.tags.includes(filterTag));
         } else {
             const allTagsButton = document.querySelector('.tag-link[data-tag="all"]');
             if (allTagsButton && !allTagsButton.classList.contains('active')) {
                  document.querySelectorAll('.tag-link.active').forEach(el => el.classList.remove('active'));
                  allTagsButton.classList.add('active');
             }
         }
         filteredPosts.sort((a, b) => b.timestamp - a.timestamp);
         postListContainer.innerHTML = '';

         if (filteredPosts.length === 0) {
              return;
          }


        filteredPosts.forEach(post => {
            const postElement = document.createElement('article');
            postElement.className = 'post-preview';
            const escapedTitle = post.title.replace(/</g, "<").replace(/>/g, ">");
            const escapedContent = post.content.replace(/</g, "<").replace(/>/g, ">");
            const excerpt = escapedContent.substring(0, 150) + (escapedContent.length > 150 ? '...' : '');

            postElement.innerHTML = `
                <h3><a href="post.html?id=${post.id}">${escapedTitle}</a></h3>
                <div class="post-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${formatDate(post.timestamp)}</span>
                    ${post.tags && post.tags.length > 0 ? `
                    <span class="post-tags">
                        <i class="fas fa-tags"></i>
                        ${post.tags.map(tag => `<span class="tag">${tag.replace(/</g, "<").replace(/>/g, ">")}</span>`).join('')}
                    </span>` : ''}
                </div>
                <p class="post-excerpt">${excerpt}</p>
                <div class="post-actions">
                     <a href="post.html?id=${post.id}" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
                     <span class="admin-actions" style="display: none;">
                         <button class="btn btn-icon btn-edit" data-id="${post.id}" title="Edit Post" aria-label="Edit Post"><i class="fas fa-edit"></i></button>
                         <button class="btn btn-icon btn-danger btn-delete" data-id="${post.id}" title="Delete Post" aria-label="Delete Post"><i class="fas fa-trash"></i></button>
                     </span>
                 </div>
            `;
            postListContainer.appendChild(postElement);
        });
        updateAdminUI();
    };

    const displayTags = () => {
        const tagFilterList = document.getElementById('tag-filter-list');
        if (!tagFilterList) return;

        const posts = getPosts();
        const allTags = new Set();
        posts.forEach(post => {
            if(post.tags && Array.isArray(post.tags)) {
                post.tags.forEach(tag => {
                    if(typeof tag === 'string' && tag.trim() !== '') {
                        allTags.add(tag.trim().replace(/</g, "<").replace(/>/g, ">"));
                    }
                })
            }
        });

        tagFilterList.innerHTML = '<button class="tag-link active" data-tag="all">All Tags</button>';

        const sortedTags = Array.from(allTags).sort();

        sortedTags.forEach(tag => {
            const button = document.createElement('button');
            button.className = 'tag-link';
            button.innerHTML = tag;
            button.dataset.tag = tag;
            tagFilterList.appendChild(button);
        });


        if (!tagFilterList.dataset.listenerAttached) {
             tagFilterList.addEventListener('click', (e) => {
                 if (e.target.classList.contains('tag-link')) {
                     document.querySelectorAll('.tag-link.active').forEach(el => el.classList.remove('active'));
                     e.target.classList.add('active');
                     const selectedTag = e.target.dataset.tag;
                     displayPosts(selectedTag);
                 }
             });
             tagFilterList.dataset.listenerAttached = 'true';
        }
    };

    const displaySinglePost = () => {
        const postContentContainer = document.getElementById('single-post-content');
        const commentsListContainer = document.getElementById('comments-list');
        if (!postContentContainer) return;

        const postId = getUrlParameter('id');
        if (!postId) {
            postContentContainer.innerHTML = '<h1>Post Not Found</h1><p>The requested post could not be found.</p>';
            if(commentsListContainer) commentsListContainer.innerHTML = '';
            return;
        }

        const posts = getPosts();
        const post = posts.find(p => p.id === postId);

         if (!post) {
            postContentContainer.innerHTML = '<h1>Post Not Found</h1><p>The requested post could not be found.</p>';
            if(commentsListContainer) commentsListContainer.innerHTML = '';
            return;
        }

        const escapedTitle = post.title.replace(/</g, "<").replace(/>/g, ">");
        const escapedContent = post.content.replace(/</g, "<").replace(/>/g, ">");
        const formattedContent = escapedContent.replace(/\n/g, '<br>');

        document.title = `${post.title} | Pratham Blog`;

        postContentContainer.innerHTML = `
            <h1>${escapedTitle}</h1>
            <div class="post-meta">
                <span><i class="fas fa-calendar-alt"></i> ${formatDate(post.timestamp)}</span>
                 ${post.tags && post.tags.length > 0 ? `
                    <span class="post-tags">
                        <i class="fas fa-tags"></i>
                        ${post.tags.map(tag => `<span class="tag">${tag.replace(/</g, "<").replace(/>/g, ">")}</span>`).join('')}
                    </span>` : ''}
            </div>
            <div class="admin-actions post-full-actions" style="display: none;">
                 <button class="btn btn-icon btn-edit" data-id="${post.id}" title="Edit Post" aria-label="Edit Post"><i class="fas fa-edit"></i></button>
             </div>
            <div class="post-full-content">
                ${formattedContent}
            </div>
        `;

        if (commentsListContainer) {
            displayComments(postId);
        }
        updateAdminUI();
    };

    const displayComments = (postId) => {
         const commentsListContainer = document.getElementById('comments-list');
         if (!commentsListContainer) return;

         const posts = getPosts();
         const post = posts.find(p => p.id === postId);

         commentsListContainer.innerHTML = '';

         if (!post || !post.comments || post.comments.length === 0) {
             return;
         }

         post.comments.sort((a, b) => b.timestamp - a.timestamp);

         post.comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            const escapedName = comment.name.replace(/</g, "<").replace(/>/g, ">");
            const escapedText = comment.text.replace(/</g, "<").replace(/>/g, ">");
            const formattedText = escapedText.replace(/\n/g, '<br>');

            commentElement.innerHTML = `
                <div class="comment-meta">
                   <span class="comment-author"><i class="fas fa-user-circle"></i> ${escapedName}</span>
                   <span class="comment-date"><i class="far fa-clock"></i> ${formatDate(comment.timestamp)}</span>
                </div>
                <p class="comment-text">${formattedText}</p>
            `;
            commentsListContainer.appendChild(commentElement);
         });
    };

    const handleCreatePostForm = () => {
        const form = document.getElementById('create-post-form');
        if (!form) return;

        const editId = getUrlParameter('editId');
        if (editId) {
             if (!checkAdminLogin()) {
                 alert('You must be logged in to edit posts.');
                 form.innerHTML = '<p>Please log in as admin to edit this post.</p><a href="index.html">Back to Home</a>';
                 return;
             }

            const posts = getPosts();
            const postToEdit = posts.find(p => p.id === editId);
            if (postToEdit) {
                document.getElementById('post-title').value = postToEdit.title;
                document.getElementById('post-content').value = postToEdit.content;
                document.getElementById('post-tags').value = postToEdit.tags ? postToEdit.tags.join(', ') : '';
            } else {
                 alert('Post to edit not found!');
                 window.location.href = 'index.html';
                 return;
            }
        }


        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('post-title');
            const contentInput = document.getElementById('post-content');
            const tagsInput = document.getElementById('post-tags');

            const title = titleInput.value.trim();
            const content = contentInput.value.trim();
            const tags = tagsInput.value.split(',')
                                 .map(tag => tag.trim())
                                 .filter(tag => tag !== '');

            if (!title || !content) {
                alert('Title and Content are required.');
                return;
            }

            let posts = getPosts();
            let postIdToRedirect = null;

            if (editId && checkAdminLogin()) {
                const postIndex = posts.findIndex(p => p.id === editId);
                if (postIndex > -1) {
                    posts[postIndex].title = title;
                    posts[postIndex].content = content;
                    posts[postIndex].tags = tags;
                    posts[postIndex].lastUpdated = Date.now();
                    savePosts(posts);
                    alert('Post updated successfully!');
                    postIdToRedirect = editId;
                } else {
                    alert('Error updating post: Original post not found.');
                    return;
                }
            } else if (!editId) {
                const newPost = {
                    id: generateId(),
                    title: title,
                    content: content,
                    tags: tags,
                    timestamp: Date.now(),
                    comments: []
                };
                posts.push(newPost);
                savePosts(posts);
                postIdToRedirect = newPost.id;
            } else {
                 alert('Login required to save changes.');
                 return;
            }


            if (postIdToRedirect) {
                window.location.href = `post.html?id=${postIdToRedirect}`;
            }
        });
    };


    const handleCommentForm = () => {
         const form = document.getElementById('comment-form');
        if (!form) return;

        const postId = getUrlParameter('id');
        if (!postId) return;

         form.addEventListener('submit', (e) => {
             e.preventDefault();
             const nameInput = document.getElementById('commenter-name');
             const textInput = document.getElementById('comment-text');

             const name = nameInput.value.trim();
             const text = textInput.value.trim();

             if (!name || !text) {
                 alert('Name and Comment text are required.');
                 return;
             }

             const newComment = {
                 id: generateId(),
                 name: name,
                 text: text,
                 timestamp: Date.now()
             };

             const posts = getPosts();
             const postIndex = posts.findIndex(p => p.id === postId);

             if (postIndex > -1) {
                if (!posts[postIndex].comments || !Array.isArray(posts[postIndex].comments)) {
                    posts[postIndex].comments = [];
                }
                 posts[postIndex].comments.push(newComment);
                 savePosts(posts);
                 displayComments(postId);
                 form.reset();
             } else {
                alert('Error posting comment: Post not found.');
             }
         });
    };

    const handleNewsletterForm = () => {
         const forms = document.querySelectorAll('.newsletter-form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const emailInput = form.querySelector('input[type="email"]');
                if (emailInput && emailInput.value) {
                    if (/^\S+@\S+\.\S+$/.test(emailInput.value)) {
                        alert(`Thank you for subscribing with ${emailInput.value}! (Demo - no actual subscription)`);
                        emailInput.value = '';
                    } else {
                         alert('Please enter a valid email address.');
                    }
                } else {
                    alert('Please enter an email address.');
                }
            });
        });
    };


    const handleAdminLoginClick = (e) => {
        e.preventDefault();
        showPasswordModal();
    };

    const handleAdminLogoutClick = (e) => {
        e.preventDefault();
        setAdminLogin(false);
        alert('Logged out.');
    };


    document.body.addEventListener('click', (e) => {
        if (e.target.matches('.btn-edit, .btn-edit *')) {
            const button = e.target.closest('.btn-edit');
            if (button && button.dataset.id) {
                handleEditPost(button.dataset.id);
            }
        }
        else if (e.target.matches('.btn-delete, .btn-delete *')) {
            const button = e.target.closest('.btn-delete');
            if (button && button.dataset.id) {
                handleDeletePost(button.dataset.id);
            }
        }
    });

    document.getElementById('admin-login-btn')?.addEventListener('click', handleAdminLoginClick);
    document.getElementById('admin-logout-btn')?.addEventListener('click', handleAdminLogoutClick);


    if (document.body.id === 'page-index') {
        displayTags();
        displayPosts();
    } else if (document.body.id === 'page-post') {
        displaySinglePost();
        handleCommentForm();
    } else if (document.body.id === 'page-create') {
        handleCreatePostForm();
        updateAdminUI();
    }

    handleNewsletterForm();

});