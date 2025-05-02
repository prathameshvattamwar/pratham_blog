document.addEventListener('DOMContentLoaded', () => {
    const storageKey = 'blogPosts';
    const adminSessionKey = 'isAdminLoggedIn';
    const themeKey = 'blogTheme';
    const ADMIN_PASSWORD = 'password123';
    const POSTS_PER_PAGE = 5;

    let currentPage = 1;
    let currentFilterTag = 'all';
    let currentSearchTerm = '';
    let currentPosts = [];
    let imageBase64 = null;

    const confirmModalElement = document.getElementById('confirmation-modal');
    const confirmModalMessageElement = document.getElementById('modal-message');
    const confirmModalConfirmBtn = document.getElementById('modal-confirm-btn');
    const confirmModalCancelBtn = document.getElementById('modal-cancel-btn');
    let confirmCallback = null;

    const passwordModalElement = document.getElementById('password-modal');
    const passwordForm = document.getElementById('password-form');
    const passwordInput = document.getElementById('admin-password-input');
    const passwordCancelBtn = document.getElementById('password-cancel-btn');
    const passwordErrorElement = document.getElementById('password-error');

    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    // --- Confirmation Modal Logic (remains the same) ---
    const showConfirmationModal = (message, onConfirm) => {
        if (!confirmModalElement || !confirmModalMessageElement) return;
        confirmModalMessageElement.textContent = message;
        confirmCallback = onConfirm;
        confirmModalElement.style.display = 'flex';
        setTimeout(() => confirmModalElement.classList.add('visible'), 10);
        confirmModalConfirmBtn?.focus();
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

    // --- Password Modal Logic (remains the same) ---
     const showPasswordModal = () => {
        if (!passwordModalElement || !passwordInput || !passwordErrorElement) return;
        passwordInput.value = '';
        passwordErrorElement.textContent = '';
        passwordInput.classList.remove('invalid');
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
             if (!passwordInput || !passwordErrorElement) return;
            const enteredPassword = passwordInput.value;
            if (enteredPassword === ADMIN_PASSWORD) {
                setAdminLogin(true);
                showToast('Admin login successful!');
                hidePasswordModal();
            } else {
                passwordErrorElement.textContent = 'Incorrect password.';
                passwordInput.classList.add('invalid');
                setAdminLogin(false);
                passwordInput.select();
                passwordInput.focus();
            }
        });
         passwordInput?.addEventListener('input', () => {
              if(passwordErrorElement) passwordErrorElement.textContent = '';
              passwordInput.classList.remove('invalid');
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

    // --- Admin Login Logic (remains the same) ---
    const checkAdminLogin = () => {
        return sessionStorage.getItem(adminSessionKey) === 'true';
    };

    const setAdminLogin = (isLoggedIn) => {
        sessionStorage.setItem(adminSessionKey, isLoggedIn);
        updateAdminUI();
        if(document.body.id === 'page-index') {
            displayPostsAndTags();
        } else if (document.body.id === 'page-post') {
            displaySinglePost();
        } else if (document.body.id === 'page-create') {
             updateCreatePageUI();
             handleCreatePostForm(); // Re-run to potentially show form if now logged in
        }
    };

    // --- LocalStorage & Utility Functions (remains the same) ---
     const getPosts = () => {
        try {
            const posts = localStorage.getItem(storageKey);
            const parsed = posts ? JSON.parse(posts) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("Error reading posts from localStorage:", e);
            return [];
        }
    };

    const savePosts = (posts) => {
         try {
            if (!Array.isArray(posts)) {
                 console.error("Attempted to save non-array to posts:", posts);
                 return;
             }
            localStorage.setItem(storageKey, JSON.stringify(posts));
         } catch (e) {
             console.error("Error saving posts to localStorage:", e);
             showToast("Error saving data. Storage might be full.", "error");
         }
    };

     const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

     const formatDate = (timestamp) => {
         if (!timestamp) return 'Date unavailable';
         try {
             return new Date(timestamp).toLocaleDateString(undefined, {
                 year: 'numeric', month: 'long', day: 'numeric'
             });
         } catch (e) {
             console.error("Error formatting date:", e);
             return 'Invalid Date';
         }
    };

    const getUrlParameter = (name) => {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };

    const sanitizeHTML = (str) => {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    };

    const showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        // Trigger reflow to enable transition
        toast.offsetHeight;
        toast.classList.add('visible');

        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                     document.body.removeChild(toast);
                 }
            }, 500);
        }, 3000);
    };


    // --- UI Update Functions (remain mostly the same) ---
    const updateAdminUI = () => {
        const isLoggedIn = checkAdminLogin();
        const loginBtn = document.getElementById('admin-login-btn');
        const logoutBtn = document.getElementById('admin-logout-btn');
        const adminActionElements = document.querySelectorAll('.admin-actions');
        const createPostLink = document.querySelector('.main-nav a[href="create.html"]');

        if (loginBtn) loginBtn.style.display = isLoggedIn ? 'none' : 'inline-flex';
        if (logoutBtn) logoutBtn.style.display = isLoggedIn ? 'inline-flex' : 'none';
        // Show create link only if logged in
        if (createPostLink) createPostLink.style.display = isLoggedIn ? 'inline-flex' : 'none';

        adminActionElements.forEach(el => {
            el.style.display = isLoggedIn ? 'inline-flex' : 'none';
        });
    };

     const updateCreatePageUI = () => {
         const editId = getUrlParameter('editId');
         const submitButton = document.querySelector('#create-post-form button[type="submit"]');
         const pageTitle = document.querySelector('.create-post-form h1');
         const formElement = document.getElementById('create-post-form');
         const formFields = formElement?.querySelectorAll('input, textarea, button');

          if (!checkAdminLogin() && document.body.id === 'page-create') {
             if (formElement) {
                 // Hide form fields instead of replacing HTML to preserve structure
                 formFields?.forEach(el => el.style.setProperty('display', 'none', 'important'));
                 // Add message if not already there
                 let msgEl = formElement.querySelector('.access-denied-message');
                 if (!msgEl) {
                    msgEl = document.createElement('div');
                    msgEl.className = 'access-denied-message';
                    msgEl.innerHTML = '<p>Admin login is required to create or edit posts.</p><a href="index.html" class="btn">Back to Home</a>';
                    formElement.prepend(msgEl); // Add message at the top
                 }
                 msgEl.style.display = 'block';
             }
              if (pageTitle) pageTitle.innerHTML = '<i class="fas fa-lock"></i> Access Denied';
              return;
         } else {
             // Ensure form fields are visible and message is hidden if logged in
             formFields?.forEach(el => el.style.display = '');
             const msgEl = formElement?.querySelector('.access-denied-message');
             if (msgEl) msgEl.style.display = 'none';
         }


         if (editId) {
              if (pageTitle) pageTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Your Blog Post';
              if (submitButton) submitButton.innerHTML = '<i class="fas fa-save"></i> Update Post';
         } else {
              if (pageTitle) pageTitle.innerHTML = '<i class="fas fa-edit"></i> Write Your New Blog Post';
              if (submitButton) submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Post';
         }
     };

    // --- Post/Comment Delete/Edit Handlers (remain the same) ---
     const handleEditPost = (postId) => {
        if (!checkAdminLogin()) {
            showToast('Login required to edit posts.', 'error');
            return;
        }
        window.location.href = `create.html?editId=${postId}`;
    };

    const handleDeletePost = (postId) => {
        if (!checkAdminLogin()) {
            showToast('Login required to delete posts.', 'error');
            return;
        }

        const message = 'Are you sure you want to delete this post and its comments? This cannot be undone.';

        showConfirmationModal(message, () => {
            let posts = getPosts();
            const updatedPosts = posts.filter(p => p.id !== postId);
            savePosts(updatedPosts);
            showToast('Post deleted successfully.', 'success');

            if (document.body.id === 'page-post' && getUrlParameter('id') === postId) {
                window.location.href = 'index.html';
            } else if (document.body.id === 'page-index') {
                 currentPosts = updatedPosts;
                 displayPostsAndTags(true); // Force refresh list
            } else {
                 window.location.href = 'index.html';
            }
        });
    };

    const handleDeleteComment = (postId, commentId) => {
         if (!checkAdminLogin()) {
             showToast('Login required to delete comments.', 'error');
             return;
         }
         const message = 'Are you sure you want to delete this comment?';
         showConfirmationModal(message, () => {
            let posts = getPosts();
            const postIndex = posts.findIndex(p => p.id === postId);
            if(postIndex > -1 && posts[postIndex].comments) {
                 posts[postIndex].comments = posts[postIndex].comments.filter(c => c.id !== commentId);
                 savePosts(posts);
                 displayComments(postId); // Re-render comments for the current post
                 showToast('Comment deleted.', 'success');
             } else {
                 showToast('Error deleting comment.', 'error');
             }
         });
     };

    // --- Post Filtering/Sorting/Display Logic ---
    const filterAndSortPosts = () => {
        let postsToDisplay = getPosts();

        if (currentSearchTerm) {
             const searchTermLower = currentSearchTerm.toLowerCase();
             postsToDisplay = postsToDisplay.filter(post =>
                 post.title.toLowerCase().includes(searchTermLower) ||
                 (typeof post.content === 'string' && post.content.toLowerCase().includes(searchTermLower)) || // Search raw markdown
                 (Array.isArray(post.tags) && post.tags.some(tag => tag.toLowerCase().includes(searchTermLower)))
             );
         }

         if (currentFilterTag && currentFilterTag !== 'all') {
             postsToDisplay = postsToDisplay.filter(post => post.tags && post.tags.includes(currentFilterTag));
         }

         postsToDisplay.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
         return postsToDisplay;
     };

    const displayPosts = (postsToDisplay) => {
        const postListContainer = document.getElementById('blog-post-list');
        const paginationContainer = document.getElementById('pagination-controls');
        if (!postListContainer || !paginationContainer) return;

        const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
        const endIndex = startIndex + POSTS_PER_PAGE;
        const paginatedPosts = postsToDisplay.slice(startIndex, endIndex);

        postListContainer.innerHTML = '';
        paginationContainer.innerHTML = '';

        if (postsToDisplay.length === 0) {
            postListContainer.innerHTML = ''; // Let :empty CSS handle message
            return;
        }

        paginatedPosts.forEach(post => {
            const postElement = document.createElement('article');
            postElement.className = 'post-preview';
            const sanitizedTitle = sanitizeHTML(post.title || 'Untitled Post');

            // *** Generate excerpt from raw Markdown ***
            let excerpt = 'No content available.';
            if (typeof post.content === 'string' && post.content.trim()) {
                 const textContent = post.content; // Use raw markdown
                 excerpt = sanitizeHTML(textContent.substring(0, 150)) + (textContent.length > 150 ? '...' : '');
            }

            const imageHTML = post.featuredImage
                ? `<img src="${post.featuredImage}" alt="" class="featured-image-preview" loading="lazy">`
                : '';

            postElement.innerHTML = `
                ${imageHTML}
                <h3><a href="post.html?id=${post.id}">${sanitizedTitle}</a></h3>
                <div class="post-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${formatDate(post.timestamp)}</span>
                    ${post.tags && post.tags.length > 0 ? `
                    <span class="post-tags">
                        <i class="fas fa-tags"></i>
                        ${post.tags.map(tag => `<span class="tag">${sanitizeHTML(tag)}</span>`).join('')}
                    </span>` : ''}
                </div>
                <p class="post-excerpt">${excerpt}</p> <!-- Show markdown excerpt -->
                <div class="post-actions">
                     <a href="post.html?id=${post.id}" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
                     <span class="admin-actions" style="display: none;">
                         <button class="btn btn-icon btn-edit" data-id="${post.id}" title="Edit Post" aria-label="Edit Post"><i class="fas fa-edit"></i></button>
                         <button class="btn btn-icon btn-danger btn-delete" data-id="${post.id}" title="Delete Post" aria-label="Delete Post"><i class="fas fa-trash"></i></button>
                     </span>
                 </div>
            `;
            // Lazy load observer could be added here if needed
            postListContainer.appendChild(postElement);
        });

        renderPaginationControls(postsToDisplay.length);
        updateAdminUI(); // Ensure admin buttons visibility is updated
    };

    // --- Pagination Controls (remains the same) ---
    const renderPaginationControls = (totalItems) => {
        const paginationContainer = document.getElementById('pagination-controls');
        if (!paginationContainer) return;

        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / POSTS_PER_PAGE);

        if (totalPages <= 1) return;

        const createButton = (text, page, isDisabled = false, isActive = false) => {
            const button = document.createElement('button');
            button.innerHTML = text;
            button.className = 'btn btn-sm';
            if (isActive) button.classList.add('active');
            button.disabled = isDisabled;
            button.dataset.page = page;
            button.addEventListener('click', () => {
                 currentPage = page;
                 const posts = filterAndSortPosts();
                 displayPosts(posts);
                 // Scroll to top of post list
                 const postListTop = document.getElementById('recent-posts-container')?.offsetTop;
                 if (postListTop !== undefined) {
                     window.scrollTo({ top: postListTop - 80, behavior: 'smooth' }); // Adjust offset as needed
                 }
            });
            return button;
        };

        // Buttons... (logic is unchanged)
        paginationContainer.appendChild(createButton('<i class="fas fa-angle-double-left"></i>', 1, currentPage === 1));
        paginationContainer.appendChild(createButton('<i class="fas fa-angle-left"></i>', currentPage - 1, currentPage === 1));

        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        startPage = Math.max(1, endPage - maxVisiblePages + 1); // Adjust startPage again based on endPage calculation


        if (startPage > 1) {
             const ellipsis = document.createElement('span');
             ellipsis.textContent = '...';
             ellipsis.className = 'pagination-ellipsis';
             paginationContainer.appendChild(ellipsis);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationContainer.appendChild(createButton(i, i, false, i === currentPage));
        }

         if (endPage < totalPages) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            paginationContainer.appendChild(ellipsis);
        }


        paginationContainer.appendChild(createButton('<i class="fas fa-angle-right"></i>', currentPage + 1, currentPage === totalPages));
        paginationContainer.appendChild(createButton('<i class="fas fa-angle-double-right"></i>', totalPages, currentPage === totalPages));
    };

    // --- Tag Display/Filtering (remains the same) ---
    const displayTags = () => {
        const tagFilterList = document.getElementById('tag-filter-list');
        if (!tagFilterList) return;

        const posts = getPosts();
        const allTags = new Set();
        posts.forEach(post => {
            if(post.tags && Array.isArray(post.tags)) {
                post.tags.forEach(tag => {
                    if(typeof tag === 'string' && tag.trim() !== '') {
                        allTags.add(tag.trim());
                    }
                })
            }
        });

        tagFilterList.innerHTML = ''; // Clear existing

        const createTagButton = (tag, text) => {
            const button = document.createElement('button');
            button.className = 'tag-link';
            button.textContent = text;
            button.dataset.tag = tag;
             if (tag === currentFilterTag) {
                 button.classList.add('active');
             }
             // Add event listener directly
             button.addEventListener('click', (e) => {
                 document.querySelectorAll('.tag-link.active').forEach(el => el.classList.remove('active'));
                 e.target.classList.add('active');
                 currentFilterTag = e.target.dataset.tag;
                 currentPage = 1; // Reset page when tag changes
                 const posts = filterAndSortPosts();
                 displayPosts(posts);
             });
             return button;
        }

        tagFilterList.appendChild(createTagButton('all', 'All Tags'));

        const sortedTags = Array.from(allTags).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

        sortedTags.forEach(tag => {
             tagFilterList.appendChild(createTagButton(tag, sanitizeHTML(tag)));
        });
    };

    const displayPostsAndTags = (forceRefresh = false) => {
          if (forceRefresh) {
              currentPosts = getPosts(); // Re-fetch if forced
          }
          const postsToDisplay = filterAndSortPosts();
          displayPosts(postsToDisplay);
          displayTags(); // Refresh tags based on current data
     }

    // --- Single Post Display ---
    const displaySinglePost = () => {
        const postContentContainer = document.getElementById('single-post-content');
        const commentsListContainer = document.getElementById('comments-list');
        const postContentDiv = postContentContainer?.querySelector('.post-full-content'); // Get specific div for content

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

        const sanitizedTitle = sanitizeHTML(post.title || 'Untitled Post');
        document.title = `${post.title || 'Blog Post'} | Pratham Blog`;
        const imageHTML = post.featuredImage
            ? `<img src="${post.featuredImage}" alt="" class="featured-image-full" loading="lazy">`
            : '';

        // Render the main structure first
        postContentContainer.innerHTML = `
            ${imageHTML}
            <h1>${sanitizedTitle}</h1>
            <div class="post-meta">
                <span><i class="fas fa-calendar-alt"></i> ${formatDate(post.timestamp)}</span>
                 ${post.tags && post.tags.length > 0 ? `
                    <span class="post-tags">
                        <i class="fas fa-tags"></i>
                        ${post.tags.map(tag => `<span class="tag">${sanitizeHTML(tag)}</span>`).join('')}
                    </span>` : ''}
                     ${post.lastUpdated ? `<span><i class="fas fa-sync-alt"></i> Updated: ${formatDate(post.lastUpdated)}</span>` : ''}
            </div>
             <div class="admin-actions post-full-actions" style="display: none;">
                 <button class="btn btn-icon btn-edit" data-id="${post.id}" title="Edit Post" aria-label="Edit Post"><i class="fas fa-edit"></i></button>
                  <button class="btn btn-icon btn-danger btn-delete" data-id="${post.id}" title="Delete Post" aria-label="Delete Post"><i class="fas fa-trash"></i></button>
             </div>
            <div class="post-full-content">
                <!-- Content will be injected here -->
            </div>
        `;

        // *** Now parse and inject the Markdown content ***
        const contentTargetDiv = postContentContainer.querySelector('.post-full-content');
        if (contentTargetDiv) {
             if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
                try {
                    // Use marked.parse() - ensure marked.js is loaded
                    contentTargetDiv.innerHTML = marked.parse(post.content || '*No content available.*');
                 } catch (e) {
                     console.error("Error parsing Markdown:", e);
                     contentTargetDiv.innerHTML = '<p><em>Error displaying content.</em></p>';
                 }
             } else {
                 console.error("marked.js library not loaded.");
                 contentTargetDiv.textContent = post.content || 'No content available (Markdown renderer not loaded).'; // Fallback to text
             }
        }


        if (commentsListContainer) {
            displayComments(postId);
        }
        updateAdminUI(); // Update admin buttons visibility
    };

    // --- Comment Display (remains the same) ---
    const displayComments = (postId) => {
         const commentsListContainer = document.getElementById('comments-list');
         if (!commentsListContainer) return;

         const posts = getPosts();
         const post = posts.find(p => p.id === postId);

         commentsListContainer.innerHTML = ''; // Clear existing

         if (!post || !post.comments || post.comments.length === 0) {
             // Let :empty CSS handle the message
             return;
         }

         // Sort comments by timestamp descending
         const sortedComments = [...post.comments].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

         const isAdmin = checkAdminLogin();

         sortedComments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            const sanitizedName = sanitizeHTML(comment.name || 'Anonymous');
             const sanitizedText = sanitizeHTML(comment.text || '');
             // Basic line break handling for plain text comments
             const formattedText = sanitizedText.replace(/\n/g, '<br>');

             const adminActionsHTML = isAdmin ? `
                 <div class="comment-actions">
                      <button class="btn btn-icon btn-danger btn-delete-comment btn-sm" data-post-id="${postId}" data-comment-id="${comment.id}" title="Delete Comment" aria-label="Delete Comment"><i class="fas fa-trash"></i></button>
                  </div>
             ` : '';

            commentElement.innerHTML = `
                 ${adminActionsHTML}
                <div class="comment-meta">
                   <span class="comment-author"><i class="fas fa-user-circle"></i> ${sanitizedName}</span>
                   <span class="comment-date"><i class="far fa-clock"></i> ${formatDate(comment.timestamp)}</span>
                </div>
                <p class="comment-text">${formattedText || '<i>No comment text.</i>'}</p>
            `;
            commentsListContainer.appendChild(commentElement);
         });
    };

    // --- Form Field Validation Helper (remains the same) ---
    const validateField = (inputElement, errorElement, message) => {
        if (!inputElement || !errorElement) return true; // Skip if elements don't exist
        if (!inputElement.value.trim()) {
            errorElement.textContent = message;
            inputElement.classList.add('invalid');
            return false;
        } else {
            errorElement.textContent = '';
            inputElement.classList.remove('invalid');
            return true;
        }
    };

    // --- Create/Edit Post Form Handler ---
    const handleCreatePostForm = () => {
        const form = document.getElementById('create-post-form');
        if (!form) return;

        // Don't run if not logged in (UI is handled by updateCreatePageUI)
        if (!checkAdminLogin()) return;


        const titleInput = document.getElementById('post-title');
        // *** Get the plain textarea element ***
        const contentInput = document.getElementById('post-content-editor');
        const tagsInput = document.getElementById('post-tags');
        const imageInput = document.getElementById('post-image');
        const imagePreview = document.getElementById('image-preview');
        const submitButton = form.querySelector('button[type="submit"]');

        const titleError = document.getElementById('title-error');
        const contentError = document.getElementById('content-error');
        const imageError = document.getElementById('image-error');

        const clearErrors = () => {
            if(titleError) titleError.textContent = '';
            if(contentError) contentError.textContent = '';
            if(imageError) imageError.textContent = '';
            titleInput?.classList.remove('invalid');
            contentInput?.classList.remove('invalid'); // Validate textarea directly
            imageInput?.classList.remove('invalid');
        };

        // --- Image handling logic (remains the same) ---
        imageBase64 = null; // Reset on form setup
        if (imageInput && imagePreview) {
             imageInput.value = ''; // Clear file input
             imagePreview.style.display = 'none';
             imagePreview.src = '#';
             imageInput.onchange = evt => {
                 const [file] = imageInput.files;
                 if (file) {
                     if (file.size > 2 * 1024 * 1024) { // 2MB Limit
                          if(imageError) imageError.textContent = 'Image size should be less than 2MB.';
                          imageInput.value = '';
                          imagePreview.style.display = 'none';
                          imageBase64 = null;
                          return;
                     }
                     const reader = new FileReader();
                     reader.onload = function(e) {
                         imagePreview.src = e.target.result;
                         imagePreview.style.display = 'block';
                         imageBase64 = e.target.result; // Store base64 string
                         if(imageError) imageError.textContent = '';
                         imageInput.classList.remove('invalid');
                     }
                     reader.readAsDataURL(file);
                 } else {
                     imagePreview.style.display = 'none';
                     imageBase64 = null;
                 }
             }
        }

        // --- Load existing data if editing ---
        const editId = getUrlParameter('editId');
        let existingImage = null;

        if (editId) {
            const posts = getPosts();
            const postToEdit = posts.find(p => p.id === editId);
            if (postToEdit) {
                 if(titleInput) titleInput.value = postToEdit.title || '';
                 // *** Set textarea value directly ***
                 if(contentInput) contentInput.value = postToEdit.content || '';
                 if(tagsInput) tagsInput.value = postToEdit.tags ? postToEdit.tags.join(', ') : '';
                 existingImage = postToEdit.featuredImage;
                 if (existingImage && imagePreview) {
                     imagePreview.src = existingImage;
                     imagePreview.style.display = 'block';
                     imageBase64 = existingImage; // Pre-fill imageBase64 if editing
                 }
            } else {
                 showToast('Post to edit not found!', 'error');
                 window.location.href = 'index.html';
                 return;
            }
        } else {
            // Clear fields if creating a new post
            if(titleInput) titleInput.value = '';
            if(contentInput) contentInput.value = '';
            if(tagsInput) tagsInput.value = '';
             if(imagePreview) imagePreview.style.display = 'none';
             if(imageInput) imageInput.value = '';
             imageBase64 = null;

        }

        // --- Form Submit Handler ---
         // Remove previous handler to avoid duplicates if function runs multiple times
         if (form._currentHandler) {
            form.removeEventListener('submit', form._currentHandler);
         }

        const currentFormHandler = (e) => {
            e.preventDefault();
            clearErrors();

            let isValid = true;

            // Validate title
            if (!titleInput || !validateField(titleInput, titleError, 'Post Title is required.')) {
                isValid = false;
            }

            // *** Validate plain textarea content ***
             if (!contentInput || !validateField(contentInput, contentError, 'Post Content cannot be empty.')) {
                 isValid = false;
             }

            if (!isValid) {
                return; // Stop submission if invalid
            }

            submitButton.disabled = true;
             submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

             const title = titleInput.value.trim();
             // *** Get content directly from textarea value ***
             const content = contentInput.value.trim();
             const tags = tagsInput.value.split(',')
                                  .map(tag => tag.trim().toLowerCase())
                                  .filter(tag => tag !== ''); // Filter empty tags

            let posts = getPosts();
            let postIdToRedirect = null;

            // Simulate save delay
             setTimeout(() => {
                if (editId) { // Update existing post
                    const postIndex = posts.findIndex(p => p.id === editId);
                    if (postIndex > -1) {
                        posts[postIndex].title = title;
                        posts[postIndex].content = content; // Store raw markdown
                        posts[postIndex].tags = tags;
                        posts[postIndex].featuredImage = imageBase64; // Use current base64 value
                        posts[postIndex].lastUpdated = Date.now();
                        savePosts(posts);
                        showToast('Post updated successfully!', 'success');
                        postIdToRedirect = editId;
                    } else {
                        showToast('Error updating post: Original post not found.', 'error');
                         submitButton.disabled = false;
                         updateCreatePageUI(); // Reset button text
                        return;
                    }
                } else { // Create new post
                    const newPost = {
                        id: generateId(),
                        title: title,
                        content: content, // Store raw markdown
                        tags: tags,
                        featuredImage: imageBase64,
                        timestamp: Date.now(),
                        comments: []
                    };
                    posts.push(newPost);
                    savePosts(posts);
                    postIdToRedirect = newPost.id;
                     showToast('Post created successfully!', 'success');
                }

                if (postIdToRedirect) {
                    window.location.href = `post.html?id=${postIdToRedirect}`;
                } else {
                    // Should not happen normally if create/update logic is correct
                    submitButton.disabled = false;
                    updateCreatePageUI();
                }
            }, 500); // Simulate network delay
        };

        // Attach the handler
        form.addEventListener('submit', currentFormHandler);
        form._currentHandler = currentFormHandler; // Store reference to remove later


         // Add live validation listeners
         titleInput?.addEventListener('input', () => validateField(titleInput, titleError, 'Post Title is required.'));
         contentInput?.addEventListener('input', () => validateField(contentInput, contentError, 'Post Content cannot be empty.'));

    };


    // --- Comment Form Handler (remains the same) ---
    const handleCommentForm = () => {
         const form = document.getElementById('comment-form');
        if (!form) return;

        const postId = getUrlParameter('id');
        if (!postId) return;

         const nameInput = document.getElementById('commenter-name');
         const textInput = document.getElementById('comment-text');
         const nameError = document.getElementById('comment-name-error');
         const textError = document.getElementById('comment-text-error');
         const submitButton = form.querySelector('button[type="submit"]');

         form.addEventListener('submit', (e) => {
             e.preventDefault();

             let isValid = true;
             if (!validateField(nameInput, nameError, 'Name is required.')) isValid = false;
             if (!validateField(textInput, textError, 'Comment text is required.')) isValid = false;

             if (!isValid) return;

             submitButton.disabled = true;
             submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

             const name = nameInput.value.trim();
             const text = textInput.value.trim();

             const newComment = {
                 id: generateId(),
                 name: name,
                 text: text,
                 timestamp: Date.now()
             };

             // Simulate post delay
             setTimeout(() => {
                const posts = getPosts();
                 const postIndex = posts.findIndex(p => p.id === postId);

                 if (postIndex > -1) {
                    if (!posts[postIndex].comments || !Array.isArray(posts[postIndex].comments)) {
                        posts[postIndex].comments = [];
                    }
                     posts[postIndex].comments.push(newComment);
                     savePosts(posts);
                     displayComments(postId); // Re-render comments
                     form.reset(); // Clear form
                     showToast('Comment posted!', 'success');
                 } else {
                    showToast('Error posting comment: Post not found.', 'error');
                 }
                 // Reset button state regardless of success/error
                 submitButton.disabled = false;
                  submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Post Comment';
             }, 300);
         });

         // Live validation for comment form
         nameInput?.addEventListener('input', () => validateField(nameInput, nameError, 'Name is required.'));
         textInput?.addEventListener('input', () => validateField(textInput, textError, 'Comment text is required.'));
    };

    // --- Newsletter Form Handler (remains the same) ---
    const handleNewsletterForm = () => {
         const forms = document.querySelectorAll('.newsletter-form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const emailInput = form.querySelector('input[type="email"]');
                if (emailInput && emailInput.value) {
                    if (/^\S+@\S+\.\S+$/.test(emailInput.value)) {
                        // Simulate subscription
                        showToast(`Thank you for subscribing with ${emailInput.value}! (Demo)`, 'success');
                        emailInput.value = ''; // Clear input on success
                    } else {
                         showToast('Please enter a valid email address.', 'error');
                    }
                } else {
                    showToast('Please enter an email address.', 'error');
                }
            });
        });
    };

    // --- Admin Login/Logout Click Handlers (remains the same) ---
     const handleAdminLoginClick = (e) => {
        e.preventDefault();
        showPasswordModal();
    };

    const handleAdminLogoutClick = (e) => {
        e.preventDefault();
        setAdminLogin(false);
        showToast('Logged out successfully.', 'info');
    };

    // --- Theme Toggle Logic ---
    const applyTheme = (theme) => {
        const body = document.body;
        const toggleIcon = themeToggleBtn?.querySelector('i');
        if (theme === 'dark') {
            body.classList.add('dark-mode');
             body.classList.remove('light-mode'); // Explicitly remove other class
             if(toggleIcon) { toggleIcon.classList.remove('fa-sun'); toggleIcon.classList.add('fa-moon'); }
        } else { // Default to light
            body.classList.remove('dark-mode');
             body.classList.add('light-mode'); // Explicitly add light class
            if(toggleIcon) { toggleIcon.classList.remove('fa-moon'); toggleIcon.classList.add('fa-sun'); }
        }
        // *** REMOVED TinyMCE theme update logic ***
    };

    const toggleTheme = () => {
         const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
         const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
         localStorage.setItem(themeKey, newTheme);
         applyTheme(newTheme);
     };

     const loadTheme = () => {
         const savedTheme = localStorage.getItem(themeKey);
         // Check system preference only if no theme is saved
         const prefersDark = savedTheme ? false : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
         applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
     };

    // --- Global Event Listeners ---
    document.body.addEventListener('click', (e) => {
        // Edit Post Button
        if (e.target.matches('.btn-edit, .btn-edit *')) {
            const button = e.target.closest('.btn-edit');
            if (button && button.dataset.id) {
                handleEditPost(button.dataset.id);
            }
        }
        // Delete Post Button
        else if (e.target.matches('.btn-delete, .btn-delete *')) {
            const button = e.target.closest('.btn-delete');
            if (button && button.dataset.id) {
                handleDeletePost(button.dataset.id);
            }
        }
        // Delete Comment Button
         else if (e.target.matches('.btn-delete-comment, .btn-delete-comment *')) {
            const button = e.target.closest('.btn-delete-comment');
            if (button && button.dataset.postId && button.dataset.commentId) {
                handleDeleteComment(button.dataset.postId, button.dataset.commentId);
            }
        }
    });

    // Search Input Listener
    searchInput?.addEventListener('input', () => {
        currentSearchTerm = searchInput.value;
        currentPage = 1; // Reset page on search
        const posts = filterAndSortPosts();
        displayPosts(posts);
        if (searchClearBtn) {
            searchClearBtn.style.display = currentSearchTerm ? 'inline-flex' : 'none';
        }
    });

    // Search Clear Button Listener
     searchClearBtn?.addEventListener('click', () => {
        if(searchInput) searchInput.value = '';
        currentSearchTerm = '';
        currentPage = 1; // Reset page
        const posts = filterAndSortPosts();
        displayPosts(posts);
         if (searchClearBtn) searchClearBtn.style.display = 'none';
         if(searchInput) searchInput.focus();
     });

    // Theme Toggle Listener
    themeToggleBtn?.addEventListener('click', toggleTheme);

    // Admin Login/Logout Listeners
    document.getElementById('admin-login-btn')?.addEventListener('click', handleAdminLoginClick);
    document.getElementById('admin-logout-btn')?.addEventListener('click', handleAdminLogoutClick);

    // --- Service Worker Registration (remains the same) ---
     if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('ServiceWorker registration successful with scope: ', registration.scope))
            .catch(error => console.log('ServiceWorker registration failed: ', error));
        });
      }

    // --- Initial Page Load Logic ---
    loadTheme();      // Apply theme first
    updateAdminUI(); // Update visibility based on login state

    // Determine page and load relevant content
    if (document.body.id === 'page-index') {
        displayPostsAndTags();
    } else if (document.body.id === 'page-post') {
        displaySinglePost();
        handleCommentForm();
    } else if (document.body.id === 'page-create') {
         updateCreatePageUI(); // Show/hide form based on login
         handleCreatePostForm(); // Initialize form logic if visible
    }

    handleNewsletterForm(); // Initialize newsletter forms on all pages

});
